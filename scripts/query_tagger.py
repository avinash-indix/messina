from data_loader import load_data_dict
from data_loader import HashVal
import unicodedata

class QueryTagger(object):
    def __init__(self, brand_dict_file, cat_dict_file, store_dict_file):
        self.hash_func  = HashVal()
        self.brand_dict = load_data_dict(brand_dict_file)
        self.cat_dict   = load_data_dict(cat_dict_file)
        self.store_dict = load_data_dict(store_dict_file)

    def getIds(self, dimensions, dimension_dict):
        ids = []
        if dimensions:
            for dim in dimensions:
                try:
                   if type(dim) == unicode:
                      str_token = unicodedata.normalize('NFKD', dim).encode('ascii', 'ignore')
                   else:
                       str_token = dim
                   hash_val  = self.hash_func.getHash(str_token.lower())
                   dim_id = dimension_dict[hash_val]
                   ids += dim_id
                except KeyError as e:
                    pass
        return ids

    def tagBrand(self, brands):
        return self.getIds(brands, self.brand_dict)

    def tagCategory(self, categories):
        return self.getIds(categories, self.cat_dict)

    def tag(self, brands, categories, stores):
        brand_ids = self.getIds(brands, self.brand_dict)
        cat_ids = self.getIds(categories, self.cat_dict)
        store_ids = self.getIds(stores, self.store_dict)
        return [brand_ids, cat_ids, store_ids]

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 4:
        print "Wrong usage"
        sys.exit(-1)
    tagger = QueryTagger(sys.argv[1], sys.argv[2], sys.argv[3])
    while True:
        word = input("word: ")
        print word
        print tagger.tag(word.lower())
