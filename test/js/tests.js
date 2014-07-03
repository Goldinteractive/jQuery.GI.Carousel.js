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

describe('jQuery.GI.Carousel (simple) tests', function () {

  var carousel;

  it('$.fn.GICarousel function exsists', function () {
    expect($.fn.GICarousel).is.not.undefined;
  });

  it('The next, prev,moveToSlide methods work as expected', function (done) {
  	var callback = sinon.spy();
  	this.timeout(10000);
    carousel = $('.GICarousel').GICarousel({
    	carousel:true,
    	onItemChange: callback,
    	onReady: function () {
    		var self = this;
    		setTimeout(function(){
    			self.next();
    		},1000);

        setTimeout($.proxy(this.next, this), 2000);
        setTimeout(function(){
        	self.moveToSlide(4);
        	expect(self.currentIndex).to.be.equal(4);

        }, 3000);
        setTimeout(function () {
        	console.log(callback);
        	expect(callback).to.have.calledThrice;
        	expect($('.GICarousel ul li.current').data('index')).to.be.equal(4);
          done();
        }, 5000);
    	}
    });
  });

  it('the carousel gets created', function () {
    carousel = $('.GICarousel').GICarousel();
    expect(carousel).is.not.undefined;
  });



  it('The public api created and the callback get called', function () {
  	var callbacks = [sinon.spy(),sinon.spy()],
    carousel = $('.GICarousel').GICarousel({
    	onBeforeInit: callbacks[0],
    	onReady: function(){
    		$.each(callbacks,function(i,callback){
		    	expect(callback).to.have.been.called;
		    });
    	},
    	onViewPortUpdate: callbacks[1]
    });

  });

  it('The destroy method works as expected', function (done) {
  	var itemLenght = $('.GICarousel ul li').length;
    carousel = $('.GICarousel').GICarousel({
    	carousel:true,
    	onDestroy: done
    });
    expect($('.GICarousel ul li')).length.to.be(itemLenght * 2);
    carousel.destroy();
    carousel = null;
    expect($('.GICarousel ul li')).length.to.be(itemLenght);
  });

  afterEach(function () {
    if (carousel)
      carousel.destroy();
    carousel = null;
  });

});