'use strict';

describe('Controller: BillingListCtrl', function () {

  // load the controller's module
  beforeEach(module('ewbMemberApp'));
  beforeEach(module('socketMock'));

  var BillingListCtrl,
      scope,
      $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/billings')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    scope = $rootScope.$new();
    BillingListCtrl = $controller('BillingListCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of billings to the scope', function () {
    $httpBackend.flush();
    expect(scope.billings.length).toBe(4);
  });
});
