'use strict';

describe('Controller: BillingCtrl', function () {

  // load the controller's module
  beforeEach(module('ewbMemberApp'));
  beforeEach(module('socketMock'));

  var BillingCtrl,
      scope,
      $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function (_$httpBackend_, $controller, $rootScope) {
    $httpBackend = _$httpBackend_;
    $httpBackend.expectGET('/api/billing')
      .respond(['HTML5 Boilerplate', 'AngularJS', 'Karma', 'Express']);

    scope = $rootScope.$new();
    BillingCtrl = $controller('BillingCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of billings to the scope', function () {
    $httpBackend.flush();
    expect(scope.billings.length).toBe(4);
  });
});
