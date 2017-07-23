var scrollers = [];

document.addEventListener("DOMContentLoaded", init);

function init() {
	
	MiniBarOptions = {
		alwaysShowBars: true
	};
	
	[].slice.call(document.querySelectorAll(".inner")).forEach(function(el, i) {
		scrollers.push(new MiniBar(el, {
			alwaysShowBars: true,
			barType: i === 5 ? "progress" : "default"
		}));
	});

	new MiniBar(document.getElementsByTagName("main")[0]);
	
	document.querySelector(".tools").addEventListener("click", function(e) {
		var t = e.target;
		
		if ( t.nodeName === "BUTTON" ) {
			var action = t.getAttribute("data-action");
			
			switch(action) {
				case "add":
					add(scrollers[8]);
					break;
				case "remove":
					remove(scrollers[8]);
					break;					
				default:
					scrollers[8][action]();
			}
		}
	});
}

function add(scroller) {
	if ( scroller.initialised ) {
		scroller.content.appendChild(scroller.content.firstElementChild.cloneNode(true));
		scroller.update();
	}
}
function remove(scroller) {
	if ( scroller.initialised && scroller.content.childElementCount > 1 ) {
		scroller.content.removeChild(scroller.content.lastElementChild);
		scroller.update();
	}
}
