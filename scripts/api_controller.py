from data_collector import DataCollector, ProductApiQuery, ProductGatsbyQuery, ProductAliasQuery
from ranking_model import RankingModel
from threading import Thread
from Queue import Queue

class SearchQuery(object):
    def __init__(self, search_term, sort_by, key, result_q, post_query, store_ids, useQas, useBrand,relavance=None):
        self.search_term = search_term
        self.sort_by = sort_by
        self.key     = key
        self.result_q = result_q
        self.is_post_query = post_query
        self.store_ids = store_ids
        self.useQas = useQas
        self.useBrandPredictor = useBrand
        self.relevance = relavance
        print "useBrand : "+str(useBrand)

    def __str__(self):
        return "q=%s,sort_by=%s,key=%s,post_query=%s, store_ids=%s, useQas=%s, useBrandPredictor=%s" % (self.search_term,
                self.sort_by, self.key, self.is_post_query, self.store_ids, self.useQas, self.useBrandPredictor)

class Worker(Thread):
    def __init__(self, data_collector, ranking_model, queries):
        Thread.__init__(self)
        self.data_collector = data_collector
        self.ranking_model  = ranking_model
        self.queries        = queries

    def run(self):
        while True:
            query = self.queries.get()
            if query.is_post_query:
                print "this is " + self.name + "\t: query.relevance:\t"+str(query.relevance)
                products = self.data_collector.post(query.search_term, query.store_ids, query.useQas, query.useBrandPredictor,query.relevance)
            else:
                products = self.data_collector.get(query.search_term, query.store_ids)
            if query.is_post_query and query.sort_by:
               try:
                   sorted_products = self.ranking_model.process(products['products'])
                   products['products'] = sorted_products
               except TypeError as e:
                   pass
            query.result_q.put({query.key : products})
            query.result_q.task_done()

    def join(self):
        self.join()

class ApiController(object):
    def __init__(self, api_host, gatsby_host, alias_host, num_threads):
        self.select_clause = "mpidStr AS \'mpid\', priceRange, aggregatedRatings, modelTitle AS \'title\', brandName, categoryNamePath, searchScore, brandName, storeId, image"
        self.page_size = 500
        self.country_code = 356
        self.gatsby_query  = ProductGatsbyQuery(self.select_clause, self.page_size, self.country_code, "/products/search2", gatsby_host)
        self.gatsbyPB_query  = ProductGatsbyQuery(self.select_clause, self.page_size, self.country_code, "/products/search2", gatsby_host)
        self.api_query     = ProductApiQuery("http", api_host, "/v2.1/search", "IN", 50)
        self.alias_service = DataCollector(ProductAliasQuery("http", alias_host, "/search", "IN"))
        self.ranking_model = RankingModel()
        self.gatsby_queries = Queue(2)
        self.gatsbyPB_queries = Queue(2)
        self.api_queries    = Queue(2)

        worker = Worker(DataCollector(self.gatsby_query), self.ranking_model, self.gatsby_queries)
        # worker.daemon = True
        print "currently running thread:\t", worker.getName()
        worker.start()

        worker = Worker(DataCollector(self.gatsbyPB_query), self.ranking_model, self.gatsbyPB_queries)
        print "currently running thread:\t", worker.getName()
        # worker.daemon = True
        worker.start()

        # for thread in range(2):
        #     worker = Worker(DataCollector(self.gatsbyPB_query), self.ranking_model, self.gatsbyPB_queries)
        #     print "currently running thread:\t", worker.getName()
        #     worker.daemon = True
        #     worker.start()
        #
        # for thread in range(2):
        #     worker = Worker(DataCollector(self.gatsby_query), self.ranking_model, self.gatsby_queries)
        #     worker.daemon = True
        #     worker.start()

        worker = Worker(DataCollector(self.api_query), self.ranking_model, self.api_queries)
        print "currently running thread:\t", worker.getName()
        # worker.daemon = True
        worker.start()

        # for thread in range(num_threads):
        #     worker = Worker(DataCollector(self.api_query), self.ranking_model, self.api_queries)
        #     # worker.daemon = True
        #     worker.start()

    def getProducts(self, search_term, sort_by, stores, useQas,relevance = None):
        alias_response = self.alias_service.getAlias(search_term)
        corrected_search_term = alias_response['correctedQ']
        if len(corrected_search_term) == 0:
            corrected_search_term = search_term
        store_ids = [store.strip() for store in stores.split(",") if store != '']
        resutl_api = Queue(1)
        resutl_q = Queue(1)
        resultBP_q = Queue(1)
        print  "relevance inside getProducts:\t" + str(relevance)
        api_q = SearchQuery(corrected_search_term, sort_by, "api", resutl_api, False, store_ids, useQas, False,None)
        gatsby_q = SearchQuery(corrected_search_term, sort_by, "gatsby", resutl_q, True, store_ids, useQas, False,relevance)
        gatsbyBP_q = SearchQuery(corrected_search_term, sort_by, "gatsbyBP", resultBP_q, True, store_ids, useQas, True,relevance)


        self.gatsby_queries.put(gatsby_q)
        self.gatsbyPB_queries.put(gatsbyBP_q)
        self.api_queries.put(api_q)

        result = {}

        # api results
        for num_result in range(1):
            res = resutl_api.get()
            for key,value in res.items():
                # print "api_key\t", key
                result[key] = value

        # gatsby without bp
        for num_result in range(1):
            res = resutl_q.get()
            for key,value in res.items():
                # print "q_key\t", key
                result[key] = value

        # gatsby with bp
        res = resultBP_q.get()
        for key,value in res.items():
            # print "bp_key\t", key
            result[key] = value


        return result
