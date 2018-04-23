import json

with open('timeline_with_entities.json') as json_data:
	d = json.load(json_data)
	
	d["entities_list"] = {}
	for entity_type in d["dataset entities"]:
		d["entities_list"][entity_type] = {}
		for entity in d["dataset entities"][entity_type]:
			key = entity[0]
			value = entity[1]
			if value != "Alderwood":
				d["entities_list"][entity_type][key] = value
	del d["dataset entities"]
	
	for node in d["nodes"]:
		for article in node["articles"]:
			article["entities"] = {}
			article["entities"]["authors"] = []
			if article["author"] != "":
				article["entities"]["authors"].append(article["author"])
			article["entities"]["organizations"] = article.pop("organizations")
			article["entities"]["people"] = article.pop("people")
			article["entities"]["misc"] = article.pop("misc")
			article["entities"]["locations"] = article.pop("locations")
			for key in article["entities"]:
				try:
					article["entities"][key].remove("Alderwood")
				except:
					pass
			
	d["links"] = {}
	links = d["links"]
	entities_types = ["authors", "organizations", "people", "misc", "locations"]
	for entity_type in entities_types:
		links[entity_type] = {}
		for source_node_id, source_node in enumerate(d["nodes"]):
			for source_article in source_node["articles"]:
				for source_entity in source_article["entities"][entity_type]:
					for target_node_id, target_node in enumerate(d["nodes"]):
						if target_node_id != source_node_id:
							for target_article in target_node["articles"]:
								for target_entity in target_article["entities"][entity_type]:
									if source_entity == target_entity:
										links[entity_type][source_node_id] = links[entity_type].get(source_node_id, {})
										links[entity_type][source_node_id][target_node_id] = links[entity_type][source_node_id].get(target_node_id, 0) + 1

	with open('data.json', 'w') as fp:
		json.dump(d, fp)