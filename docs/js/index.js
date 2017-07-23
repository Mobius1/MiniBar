var scrollers = [];

document.addEventListener("DOMContentLoaded", init);

function init() {

	MiniBarOptions = {
		alwaysShowBars: true
	};

	[].slice.call(document.querySelectorAll(".inner")).forEach(function(el, i) {

		if ( el.nodeName !== "TEXTAREA" ) {
			el.firstElementChild.innerHTML = getContent();
		}

		scrollers.push(new MiniBar(el, {
			alwaysShowBars: "visible" in el.dataset,
			barType: i === 4 ? "progress" : "default"
		}));

		if ( el.nodeName === "TEXTAREA" ) {
			setTimeout(function() {
				moveCaretToEnd(scrollers[i].content);
			}, 10);
		}
	});

	new MiniBar(document.getElementsByTagName("main")[0]);

	document.querySelector(".tools").addEventListener("click", function(e) {
		var t = e.target;

		if ( t.nodeName === "BUTTON" ) {
			var action = t.getAttribute("data-action");

			switch(action) {
				case "add":
					add(scrollers[7]);
					break;
				case "remove":
					remove(scrollers[7]);
					break;
				default:
					scrollers[7][action]();
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

function moveCaretToEnd(el) {
	el.selectionStart = el.selectionEnd = el.value.length;
	el.focus();
}

function getContent() {
	return "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><h3>Section 1.10.32 of de Finibus Bonorum et Malorum, written by Cicero in 45 BC</h3><p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?</p><h3>1914 translation by H. Rackham</h3><p>But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?</p>";
}