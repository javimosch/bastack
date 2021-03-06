export default function() {
    return {
        name: '$db',
        def: [
            '$http', '$log', 'usSpinnerService', '$resolver',
            function($http, $log, usSpinnerService, $resolver) {
                var self = {};
                $resolver.expose('$db', self);
                var requests = 0,
                    token;
                self.setToken = (t) => token = t;
                self.isBusy = () => requests > 0;
                self.getRequests = () => requests;
                self.addController = (n, actions) => {
                    self[n] = {};
                    actions.forEach(action => {
                        self[n][action] = (data) => {
                            if (token) data._token = token;
                            return new Promise((resolve, reject) => {
                                usSpinnerService.spin('spinner-1');
                                requests++;
                                $http.post('/api/' + n + '/' + action, data, {}).then(handleResponse(resolve, reject, $log), handleResponse(reject, null, n === 'auth'));

                            });
                        };
                    })
                };

                function handleResponse(resolve, reject, isAuth) {
                    return function(data, status, headers, config) {

                        requests--;
                        setTimeout(() => usSpinnerService.stop('spinner-1'), 1000);

                        reject = reject || resolve;
                        var handler = resolve;

                        if (data.data && data.data.ok !== undefined) {
                            data = data.data;
                            if (data.ok === false) {
                                handler = reject;
                                $log.warn('DB', data.err);
                            }
                            else {
                                $log.info('DB', data.result);
                                data = data.result;
                            }
                        }
                        else {
                            $log.error('DB', data, status, config.headers);
                        }


                        handler(
                            data, {
                                data: data,
                                status: status,
                                headers: headers,
                                config: config
                            });
                    };
                }


                return self;
            }
        ]
    };
}
