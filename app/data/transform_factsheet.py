import json

with open('factsheets.json') as json_data:
	d = json.load(json_data)
	for key in d:
		d[key] = d[key].encode('ascii','ignore').replace('\n', '<br />').replace('\t', '').replace('"', '\'')

	with open('data_factsheets.json', 'w') as fp:
		json.dump(d, fp)