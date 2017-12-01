from collections import Counter

import requests
import json

HTTP_SUCCESS = 200

class HttpClient(object):
    def __init__(self):
       pass

    def query(self, url):
        try:
            res = requests.get(url)
            if res.status_code != HTTP_SUCCESS:
                raise Exception("Api error" + str(res.text))
            return res.json()
        except Exception as e:
            print e
        return ""

    def postQuery(self, url, headers, params):
        try:
            #print url, " ", headers, " ", json.dumps(params)
            res = requests.post(url, headers = headers, data = json.dumps(params))
            if res.status_code != HTTP_SUCCESS:
                raise Exception("Api Error " + str(res.text))
            return res.json()
        except Exception as e:
            print e
        return ""
