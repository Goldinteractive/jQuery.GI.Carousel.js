describe('jQuery.GI.Carousel (simple) tests', function() {
	var carousel;
	it('$.fn.GICarousel function exsists',function(){
		expect($.fn.GICarousel).is.not.undefined;
	});
	it('the carousel gets created',function(){
		carousel = $('.GICarousel').GICarousel();
	});
});