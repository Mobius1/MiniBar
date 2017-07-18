document.addEventListener("DOMContentLoaded", function(e) {
	var scrollers = [];
	[].slice.call(document.getElementsByClassName("content")).forEach(el => {
		scrollers.push(new MiniBar(el, {
			alwaysShowBars: "visible" in el.dataset
		}));
	});
});