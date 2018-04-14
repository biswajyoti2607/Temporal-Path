from nltk.tag.stanford import StanfordNERTagger
from nltk.tokenize import word_tokenize
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
import re
import json

# ONLY NEED TO DO THIS ONE TIME!! (or run the download punkt.py file)
# nltk.download('punkt')

# References for this page
# NER: https://pythonprogramming.net/named-entity-recognition-stanford-ner-tagger/
# More useful chunking: https://stackoverflow.com/questions/30664677/extract-list-of-persons-and-organizations-using-stanford-ner-tagger-in-nltk
# split caps words: http://code.activestate.com/recipes/440698-split-string-on-capitalizeduppercase-char/
# Topic Modeling: https://medium.com/mlreview/topic-modeling-with-scikit-learn-e80d33668730

def get_continuous_chunks(tagged_sent):
    continuous_chunk = []
    current_chunk = []

    for token, tag in tagged_sent:
        if tag != "O":
            current_chunk.append((token, tag))
        else:
            if current_chunk: # if the current chunk is not empty
                continuous_chunk.append(current_chunk)
                current_chunk = []
    # Flush the final current_chunk into the continuous_chunk, if any.
    if current_chunk:
        continuous_chunk.append(current_chunk)
    return continuous_chunk

def split_on_caps(str):
    rs = re.findall('[A-Z][^A-Z]*', str)
    fs = ""
    for word in rs:
        fs += " " + word
    return fs

def number_of_articles(dictionary):
    count = 0
    for articles in dictionary:
        for article in articles['articles']:
            count += 1
    return str(count)

# ----------------------------------------where we clean up the text------------------------------------------
def process_text(text):
    # cut off substring up until after "Date Published to Web: "
    text = text[text.find('Date Published to Web: '):]
    text = text[text.find("</p><p>"):]
    # remove all occurences of "</p><p>"
    text = text.replace("</p><p>", " ")

    # Preprocessing data
    text = split_on_caps(text)

    return text


def entity_extraction(text):
    text = process_text(text)

    # NER
    tokenized_text = word_tokenize(text)
    classified_text = st.tag(tokenized_text)

    # BETTER CHUNKING
    named_entities = get_continuous_chunks(classified_text)
    named_entities = [(" ".join([token for token, tag in ne]), ne[0][1]) for ne in named_entities]

    # if string is already in there or as a part of a longer string...
    # for entity, category in named_entities:
    # problematic, you get things like ('Douglas Herndon Suzanne Kirchner', 'PERSON'), ('Suzanne Kirchner', 'PERSON'),
    # but also things like: ('Dennis Birr', 'PERSON'), ('Birr', 'PERSON')
    # also overlap of things like 'Alderwood' in both location/organization/etc.

    # for now just remove tuple already in there!! ('Olympia', 'LOCATION'), ('Olympia', 'LOCATION')
    final_entities = []
    for tuple in named_entities:
        if tuple not in final_entities:
            final_entities.append(tuple)

    return final_entities


# --------------------------------------------------Topic Modeling-----------------------------------------------
def lda_to_topics_dict(model, feature_names, num_top_words):
    topics_dict = {}
    for topic_idx, topic in enumerate(model.components_):
        name = "Topic %d:" % (topic_idx)
        topic_list = [feature_names[i]
                  for i in topic.argsort()[:-num_top_words - 1:-1]]
        topics_dict[name] = topic_list
    return topics_dict

def documents_to_topics(documents, num_features=1000, num_topics=10, num_top_words=10):
    # max-df to remove terms that appear too frequently: ignore terms that appear in more than max_df (0.5) of documents,
    # min-df to remove terms that dont appear enough: ignore terms that appear in less than min_df(0.5) of documents: 1 here
    # LDA can only use raw term counts for LDA because it is a probabilistic graphical model
    # default: dont ignore any terms!!
    tf_vectorizer = CountVectorizer(max_df=1.0, min_df=1, max_features=num_features, stop_words='english')
    tf = tf_vectorizer.fit_transform(documents)
    tf_feature_names = tf_vectorizer.get_feature_names()

    # Run LDA (more max_iter better!)
    lda = LatentDirichletAllocation(n_components=num_topics, max_iter=100, learning_method='online',
                                    learning_offset=50., random_state=0).fit(tf)

    topics = lda_to_topics_dict(lda, tf_feature_names, num_top_words)

    return topics



st = StanfordNERTagger('./Stanford_NER/english.conll.4class.distsim.crf.ser.gz',
 					   './Stanford_NER/stanford-ner.jar',
 					   encoding='utf-8')

# initial data
with open('./timeline.json', encoding='utf-8') as data_file:
    full_json = json.loads(data_file.read())

# list of dictionaries

# nodes, links, dataset entities
nodes = full_json['nodes']
print('NODES-----------------------------------------')
print(nodes)
print("number of articles is: " + number_of_articles(nodes))

# each date is unique has a list of articles for it -> there should be like 200-300 articles
dataset_entities = {}
# key: tuple, value: count
# add author as ("author", 'AUTHOR'), value;count

article_list_for_topics_modeling = []

# -------------------------------------------------------article entities----------------------------------------------
for article_info in nodes:
    # allow dictionary to have multiple entries! dict key is date!
    dict_key = article_info['date']

    # This is for EACH article
    for article in article_info['articles']:
        text = article['text']

        entities = entity_extraction(text)

        print(entities)
        # new node in article for article entities

        # add diff entities to article
        article['people'] = []
        article['locations'] = []
        article['organizations'] = []
        article['misc'] = []


        for entity, category in entities:
            if category == 'PERSON':
                target_list = article['people']
            elif category == 'LOCATION':
                target_list = article['locations']
            elif category == 'ORGANIZATION':
                target_list = article['organizations']
            elif category == 'MISC':
                target_list = article['misc']

            if entity not in target_list:
                target_list.append(entity)

        author_entity = ( article['author'] , 'AUTHOR' )
        entities.append(author_entity)

        for tuple_entity in entities:
            if tuple_entity not in dataset_entities:
                dataset_entities[tuple_entity] = 1
            else:
                dataset_entities[tuple_entity] += 1

        # topic modeling
        text = process_text(text)
        # default for docouments_to_topics num_features=1000, num_topics=10, num_top_words=10
        topics = documents_to_topics([text])
        article['topics'] = topics

        article_list_for_topics_modeling.append(text)

# ------------------------------------full dataset entities------------------------------------------------------------
total_people_list = []
total_location_list = []
total_org_list = []
total_misc_list = []
total_author_list = []

print(dataset_entities)

for (entity, category), count in dataset_entities.items():
    if category == 'PERSON':
        target_list = total_people_list
    elif category == 'LOCATION':
        target_list = total_location_list
    elif category == 'ORGANIZATION':
        target_list = total_org_list
    elif category == 'MISC':
        target_list = total_misc_list
    elif category == 'AUTHOR':
        target_list = total_author_list

    target_list.append( (entity, count) )

all_entities = {}
all_entities['people'] = total_people_list
all_entities['locations'] = total_location_list
all_entities['organizations'] = total_org_list
all_entities['misc'] = total_misc_list
all_entities['authors'] = total_author_list

for key, entity_list in all_entities.items():
    # sort from highest to lowest
    all_entities[key] = sorted(entity_list, key=lambda tup: tup[1], reverse=True)

print(all_entities)

# topic modeling
dataset_topics = documents_to_topics(article_list_for_topics_modeling,num_topics=20)
all_entities['topics'] = dataset_topics

full_json['dataset entities'] = all_entities

# convert nodes back to a json file (timeline.json later)
with open('timeline_with_entities.json', 'w') as fp:
	json.dump(full_json, fp)