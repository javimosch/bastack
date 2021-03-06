export default function() {
    return ['$scope', '$log', '$db', '$resolver', '$notify', '$timeout', '$location', '$session', function($scope, $log, $db, $resolver, $notify, $timeout, $location, $session) {
        $resolver.expose('s', $scope);
        $scope.email = $session.getCredentials().email;
        $scope.pwd = $session.getCredentials().pwd;
        $scope.isBusy = () => $db.isBusy() || $scope.busy;
        $scope.submit = function() {
            $resolver.coWrapExec(function*() {
                var data = yield $db.auth.login({
                    email: $scope.email,
                    pwd: $scope.pwd
                });
                $scope.busy = true;
                $notify.set("You are in !");
                $session.saveCredentials($scope.email, $scope.pwd);
                if (data._token) {
                    $session.updateWith(data._token, data.account);
                }
                $timeout(function() {
                    $location.path('/dashboard');
                }, 2000);
            }).catch($notify.handleInvalidResponse());
        };
        $scope.recoverPwd = function() {
            $resolver.coWrapExec(function*() {
                var data = yield $db.auth.generatePassword({
                    email: $scope.email
                });
                $notify.set(data.message, {
                    sticky: true
                });
            }).catch($notify.handleInvalidResponse());
        };
    }];
}
