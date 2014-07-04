var publicMethods = [
  'setViewport',
  'startAutoslide',
  'stopAutoslide',
  'moveToSlide',
  'next',
  'prev',
  'bindAll',
  'unbindAll'
];

describe('Core Tests', function () {
  var callbacks = [sinon.spy(), sinon.spy(), sinon.spy()],
  		destroyCallback = sinon.spy(),
  		onItemChangeCallback =  sinon.spy(),
  		itemLenght = $('.GICarousel ul li').length,
  		carousel = $('.GICarousel').GICarousel({
  			onBeforeInit: callbacks[0],
  			onReady: callbacks[1],
  			onViewPortUpdate: callbacks[2],
  			onDestroy: destroyCallback,
  			onItemChange: onItemChangeCallback,
  			carousel:true
  		});

  it('$.fn.GICarousel function exsists', function () {
    expect($.fn.GICarousel).is.not.undefined;
  });

  it('the carousel instance gets created', function () {
    expect(carousel).is.not.undefined;
  });

  if('All the public methods are available',function(){
    $.each(publicMethods, function (i, method) {
       expect(carousel[method]).to.be.a('function');
    });
  });

  it('The public api has been created and the callbacks get called', function () {
    $.each(callbacks, function (i, callback) {
       expect(callback).to.have.been.called;
    });
  });

  it('The next, prev,moveToSlide methods work as expected', function (done) {

    this.timeout(10000);

    setTimeout($.proxy(carousel.next, carousel), 1000);
    setTimeout($.proxy(carousel.next, carousel), 2000);
    setTimeout(function () {
      carousel.moveToSlide(4);
      expect(carousel.currentIndex).to.be.equal(4);
    }, 3000);
    setTimeout(function () {
      expect(onItemChangeCallback).to.have.calledThrice;
      expect($('.GICarousel ul li.current').data('index')).to.be.equal(4);
      done();
    }, 5000);

  });

  it('The destroy method works as expected', function () {
    expect($('.GICarousel ul li')).length.to.be(itemLenght * 2);
    carousel.destroy();
    expect(destroyCallback).to.have.been.called;
    expect($('.GICarousel ul li')).length.to.be(itemLenght);
  });

});
