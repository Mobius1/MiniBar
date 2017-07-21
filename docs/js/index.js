document.addEventListener("DOMContentLoaded", init);
window.addEventListener("load", init);

function init() {
	var scrollers = [];
	[].slice.call(document.querySelectorAll(".content")).forEach((el, i) => {
		scrollers.push(new MiniBar(el, {
			alwaysShowBars: "visible" in el.dataset,
			barType: i === 4 ? "progress" : "default"
		}));
	});

	new MiniBar(document.getElementsByTagName("main")[0], {
		alwaysShowBars: true
	});
}
