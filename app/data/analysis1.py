import glob
import os
import re
import datetime
import json

article_count = 0
title_map = {}
author_map = {}
date_map = {}
timeline = {}
timeline["nodes"] = []
entities = {}
for filename in glob.glob(os.path.join('./raw_articles', '*.txt')):
	print filename
	if filename.startswith('./raw_articles\\11'):
		result = "FILE :: " + filename
		with open(filename) as f:
			content = f.readlines()
		content = [x.strip() for x in content]
		title = content[0]
		if re.split(': ',content[1])[0] != "Story by" and re.split(': ',content[2])[0] != "Story by":
			author = ""
		elif re.split(': ',content[1])[0] == "Story by":
			author = re.split(': ',content[1])[1]
		else:
			author = re.split(': ',content[2])[1]
		if re.split(': ',content[2])[0].startswith("Date") and re.split(': ',content[1])[0].startswith("Date"):
			date = ""
		elif re.split(': ',content[2])[0].startswith("Date"):
			date = re.split(': ',content[2])[1]
			try :
				date = datetime.datetime.strptime(date, "%m/%d/%Y")
			except:
				date = datetime.datetime.strptime(date, "%B %d, %Y")
		else:
			date = re.split(': ',content[1])[1]
			try :
				date = datetime.datetime.strptime(date, "%m/%d/%Y")
			except:
				date = datetime.datetime.strptime(date, "%B %d, %Y")
		result = result + ", TITLE : " + title + " , AUTHOR : " + author + " , DATE : " +  str(date)
		print(result)
		text_content = "</p><p>".join(content)
		text_content = text_content.decode('utf-8', errors='ignore').encode('ascii', errors='ignore')
		type = "News Article"
		if author != "":
			author_map[author] = author_map.get(author, 0) + 1
		if author == "":
			if "briefs" in title.lower() or "briefly" in title.lower():
				title = "Briefs"
			if "obituaries" in title.lower():
				title = "Obituaries"
			title_map[title] = title_map.get(title, 0) + 1
			#print("SECOND LINE :: " + content[1])
			article_count = article_count + 1
			type = "Auxiliary Article"
		if date != "":
			date_map[date] = date_map.get(date, 0) + 1
			is_present = False
			for node in timeline["nodes"]:
				if node["date"] == str(date):
					node["articles"].append({"title": title, "Authors": author, "date": date.strftime('%d, %b %Y'), "type": type, "text": str(text_content)})
					is_present = True
			if not is_present:
				node = {}
				node["date"] = str(date)
				node["articles"] = []
				node["articles"].append({"title": title, "Authors": author, "date": date.strftime('%d, %b %Y'), "type": type, "text": str(text_content)})
				timeline["nodes"].append(node)
for key in title_map.keys():
	if title_map[key] == 1:
		title_map["Others"] = title_map.get("Others", 0) + 1

print("-----------------------------------------------------------------------------")
print("Number of News Article :: " + str(article_count))
print("-----------------------------------------------------------------------------")
		
print("-----------------------------------------------------------------------------")
for key, value in sorted(title_map.iteritems(), key=lambda (k,v): (v,k), reverse=True):
	print(key + " : " + str(value))

print("-----------------------------------------------------------------------------")
print("Number of Date Data Points :: " + str(len(date_map.keys())))
print("-----------------------------------------------------------------------------")
date_map_keys = date_map.keys()
date_map_keys.sort()
for key in date_map_keys:
	print(str(key) + " : " + str(date_map[key]))
	
print("-----------------------------------------------------------------------------")
for key, value in sorted(author_map.iteritems(), key=lambda (k,v): (v,k), reverse=True):
	print(key + " : " + str(value))
entities["Authors"] = author_map
	
print("-----------------------------------------------------------------------------")
timeline["nodes"].sort(key=lambda x: x["date"], reverse=False)
timeline["links"] = []
for id, node in enumerate(timeline["nodes"]):
	for article in node["articles"]:
		for id2, node2 in enumerate(timeline["nodes"]):
			for article2 in node2["articles"]:
				if article["Authors"] == article2["Authors"] and article["Authors"] != "" and id != id2:
					print(str(id) + " , " + str(id2) + " = " + article["Authors"])
					is_present = False
					for link_stored in timeline["links"]:
						if (link_stored["source"] == id and link_stored["target"] == id2):
							link_stored["count"] = link_stored["count"] + 1
							is_present = True
					if not is_present:
						link = {}
						link["source"] = id
						link["target"] = id2
						link["count"] = 1
						timeline["links"].append(link)
		
with open('timeline.json', 'w') as fp:
	json.dump(timeline, fp)

with open('entities.json', 'w') as fp:
	json.dump(entities, fp)