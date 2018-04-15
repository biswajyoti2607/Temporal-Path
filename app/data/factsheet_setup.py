import glob
import os
import json

terrorist_orgs = ['south american terrorist organizations', 'AUC', 'ELN', 'FARC', 'SF', 'MRTA']
# multiple south american terrorist organizations, add them as a key for each one separately(?)+ terrorist!!
factsheet_list = ['adamsite', 'arsenic', 'botulism', 'e. coli', 'lewisite', 'ricin', 'salmonella', 'sulfur mustard']
                  # ,terrorist orgs, (these last ones aren't quuuite factsheets...
post_factsheets = ['missile silo', 'map', 'advertisements', 'exports']

full_json = {}
file_count = 0
post_file_count = 0
# initial data
# open raw txt files for 12.... and save text as key name fact sheet
for filename in glob.glob(os.path.join('./raw_articles', '*.txt')):
    if filename.startswith('./raw_articles\\12'):
        print(filename)

        with open(filename) as f:
            data = f.read()
            print(data)

            print("file count is: " + str(file_count))

            if file_count < 8:
                full_json[ factsheet_list[file_count] ] = data
            elif file_count == 8:
                # terrorist orgs
                for item in terrorist_orgs:
                    full_json[ item ] = data
            else:
                full_json[post_factsheets[post_file_count]] = data
                post_file_count += 1


            file_count += 1
            print(file_count)

print(full_json)
for key, value in full_json.items():
    print(key)


# convert nodes back to a json file (timeline.json later)
with open('factsheets.json', 'w') as fp:
    json.dump(full_json, fp)
