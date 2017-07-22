var scrollers = [];

document.addEventListener("DOMContentLoaded", init);

function init() {
	
	MiniBarOptions = {
		alwaysShowBars: true
	};
	
	[].slice.call(document.querySelectorAll(".inner")).forEach((el, i) => {
		scrollers.push(new MiniBar(el, {
			alwaysShowBars: "visible" in el.dataset,
			barType: i === 5 ? "progress" : "default"
		}));
	});

	new MiniBar(document.getElementsByTagName("main")[0]);
}
