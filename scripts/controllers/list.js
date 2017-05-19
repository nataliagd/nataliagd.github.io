'use strict';

/**
 * @ngdoc function
 * @name trovelistsApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the trovelistsApp
 */
angular.module('trovelistsApp')
  .controller('ListCtrl', ['$scope', '$rootScope', '$routeParams', '$document', '$filter', '$http', '$q', '$location', 'ListsDataFactory', function($scope, $rootScope, $routeParams, $document, $filter, $http, $q, $location, ListsDataFactory) {
    $document.scrollTop(0);
    //this.order = $routeParams.order;
    //this.list = lists[listId];
    $scope.closeTertiary = function() {
      $('.popup-highlights').removeClass('is-visible');
      $('#resources-header, #resources-secondary').css({
        'display': 'block',
      });
      $('.resources, .featured').css({
        'overflow': 'scroll',
      });
    }
    $scope.displayPrevTertiary = function(event) {
      var index = $scope.listitems.indexOf($scope.item) - 1;
      if (index <= 0) {
        index = $scope.listitems.length - 1;
      }
      $scope.displayTertiary(index, event);
    }
    $scope.displayNextTertiary = function(event) {
      var index = $scope.listitems.indexOf($scope.item) + 1;
      if (index >= $scope.listitems.length) {
        index = 0;
      }
      $scope.displayTertiary(index, event);
    }
    $scope.displayTertiary = function(order, event) {
      event.preventDefault();
      $scope.isloading = true;

      var item = $scope.listitems[order];
      $scope.item = item;
      $('#viewitemurl').attr('href', item.url);
      $('.itemdisplaytext').html(item.note);
      //setItem(item);
      $('.popup-highlights').addClass('is-visible');
      if (item.thumbnail != undefined) {
        $('#itemimagesrc').css('display', 'block');
        var image = $('#itemimagesrc')[0];
        image.src = "img/loading.gif";
        var downloadingImage = new Image();
        downloadingImage.onload = function() {
          image.src = this.src;

        };
        downloadingImage.src = item.thumbnail;
      } else {
        $('#itemimagesrc').css('display', 'none');


      }
      $('.itemtitle').html(item.title);
      $('.itemdate').html(item.date);
      $('.itemtype').html(item.type);
      if (item.newspaper != undefined) {
        $('.itemcaption').html("<p><em>" + item.newspaper + "</em>, page " + item.page + "</p>");
      } else {
        $('.itemcaption').html("");
      }
      showSlides(1);

      $scope.isloading = false;
    };
    var setItem = function(item) {
      //var item = $filter('findById')($rootScope.items, $routeParams.order);
      $scope.item = item;
      if (item.type === 'newspaper') {
        $http.jsonp(troveApiUrl + '/newspaper/' + item.id + '?encoding=json&reclevel=full&include=articletext&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {
            cache: true
          })
          .then(function successCallback(response) {
            $scope.isloading = false;
            //var paras = response.data.article.articleText.match(/<p>.*?<\/p>/g);
            //$scope.articleText = paras.slice(0,5).join('') + '&hellip;';
            $scope.articleText = response.data.article.articleText;
            $scope.words = response.data.article.wordCount;
            $scope.showText('snippet');
          });
      } else if (item.type === 'work' && item.holdings === 1) {
        $http.jsonp(troveApiUrl + '/work/' + item.id + '?encoding=json&reclevel=full&include=holdings&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {
            cache: true
          })
          .then(function successCallback(response) {
            $scope.isloading = false;
            var nuc;
            try {
              nuc = response.data.work.holding[0].nuc;
            } catch (e) {
              //Do nothing
            }
            if (typeof nuc !== 'undefined') {
              $http.jsonp(troveApiUrl + '/contributor/' + nuc + '?encoding=json&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {
                  cache: true
                })
                .then(function successCallback(response) {
                  $scope.repository = response.data.contributor.name.replace(/\.$/, '');
                });
            }
          });
      } else {
        $scope.isloading = false;
      }
    };
    $scope.showText = function(length) {
      if (length === 'snippet') {
        $scope.displayText = $filter('words')($scope.articleText, 100);
        $scope.fullText = false;
      } else {
        $scope.displayText = $scope.articleText;
        $scope.fullText = true;
      }

    };
    $scope.nextList = function() {
      var order = parseInt($routeParams.order, 10);
      if (order < $rootScope.lists.length) {
        $location.path('topics/' + (order + 1));
      }
    };
    $scope.previousList = function() {
      var order = parseInt($routeParams.order, 10);
      if (order !== 1) {
        $location.url('topics/' + (order - 1));
      }
    };
    var setList = function() {
      var list = $filter('findById')($rootScope.lists, $routeParams.order);
      var listitems = $filter('itemsInList')($rootScope.items, list.order);
      $scope.list = list;
      $scope.listitems = listitems;
    };
    if (typeof $rootScope.items === 'undefined' && $rootScope.failed !== true) {
      var tries = 1;
      var loadListData = function() {
        var promises = ListsDataFactory.getPromises();
        $q.all(promises).then(
          function successCallback(responses) {
            ListsDataFactory.loadResources(responses);
            setList();
          },
          function errorCallback() {
            if (tries < 1) {
              tries++;
              loadListData();
            } else {
              //$rootScope.listHide = false;
              $rootScope.failed = true;
            }
          });
      };
      loadListData();
    } else if ($rootScope.failed === true) {
      $location.url('/');
    } else {
      setList();
    }
  }]);
