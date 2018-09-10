console.log("grid-layout.js connected");

$(document).ready(function() {

//Prevents favicon from throwing error
	$.get("/favicon.ico").then((response) => {
		if(!response) {
			console.log("empty response");
		}else {
			console.log("no favicon");
		}
	}).catch((err) => {console.log(err); throw err;});
	
//Controls for masonry image grid
	console.log("reading masonry script");
	//init masonry grid 
	let grid = document.querySelector('.grid');
	let msnry = new Masonry( grid, {
	  // options...
	  itemSelector: '.grid-item',
	  columnWidth: ".grid-sizer",
	  percentPosition: true
	});

	imagesLoaded( grid ).on( 'progress', function() {
	  // layout Masonry after each image loads
	  msnry.layout();
	});

//controls the deletion of randomly generated images dispayed on /index
	let gridItems = document.getElementsByClassName("grid-item");
	let items = Array.from(gridItems);
	let delItems = document.getElementsByClassName("del-seed");
	let del = Array.from(delItems);

	del.forEach(function(deleted, idx) {
		deleted.addEventListener("click", function(evt) {
			evt.preventDefault();
			items.forEach(function(item, i) {
				if(idx === i) {
					msnry.remove(item);
					msnry.layout();
				}
			});
		});
	});

//controls for image selection modal triggered on index page
	let modalWrapper = document.getElementById('modal-wrapper');
	let myBoards = document.getElementsByClassName("my-boards")[0];

	if(document.getElementsByClassName("modal-panel")[0]) {
		let modalPanel = document.getElementsByClassName("modal-panel")[0];
		let modalClose = document.getElementById("modal-close");
		let saveBoard = document.getElementsByClassName("save-board")[0];
		let saveImage = document.getElementsByClassName("save-image")[0];
		let specs = document.getElementsByClassName("specs")[0];
		let imgInfo = document.getElementsByClassName("img-info")[0];
		let imgForm =document.getElementById("img-form");
		let footerContainer = document.getElementsByClassName("footer-container")[0];
		let dashHd = document.getElementsByClassName("dash-head")[0];
		let myBoards = document.getElementsByClassName("my-boards")[0]

		document.getElementById("dash-container-all").style.backgroundColor = "#444";
		dashHd.style.display = "none";
		myBoards.style.display = "none";

		modalClose.addEventListener("click", (evt) =>{
			evt.preventDefault();
			modalPanel.style.opacity = "0";
			footerContainer.style.display = "flex";
			document.getElementById("dash-container-all").style.backgroundColor = "";
			dashHd.style.display = "flex";
			myBoards.style.display = "flex";
			window.scrollTo(0 ,0);

			setTimeout(function(){
				modalPanel.style.display = "none";
			},300);

			setTimeout(function() {
				myBoards.style.opacity = 1;
				//window.location.reload(true);
			}, 800)
		});

		saveImage.addEventListener("click", (evt) => {
			evt.preventDefault();
			imgInfo.style.display = "none";
			imgForm.style.display = "flex";
			modalWrapper.style.justifyContent = "center";
			document.getElementsByClassName("modal-ctrl-box")[0].append(modalClose);
			saveImage.style.display = "none";
		});

	//Forces myBoards to remain visible if page reloaded/refreshed
		if(performance.navigation.type == 1) {
		    console.info( "page reloaded" );
		    modalPanel.style.display = "none";
		    myBoards.style.opacity = 1;
		  } else {
		    console.info( "page is not reloaded");
		  }
	 } //end conditional

//Prevents inactive buttons from causing bubble up page jerk
	 let btnColl = document.getElementsByClassName("inactive-btn");
	 let inactiveBtns = Array.from(btnColl);
	 inactiveBtns.forEach((btn) => {
	 	btn.addEventListener("click", (evt) => {
	 		evt.preventDefault();
	 		evt.stopPropagation();
	 	});
	 });

//Controls for the add image button, triggered from /user-board
	if(document.getElementsByClassName("add-btn")[0]) {
		let addBtn = document.getElementsByClassName("add-btn")[0];
	
		if(document.getElementsByClassName("addimg-modal")[0]) {
			let addModal = document.getElementsByClassName("addimg-modal")[0];
			addBtn.addEventListener("click", (evt) => {
				console.log("btn clicked");
				if(addModal) {
					addModal.style.display = "flex";
					document.getElementsByClassName("container")[0].style.backgroundColor = "#444";
					document.getElementsByClassName("user-board-title")[0].style.visibility = "hidden";
					document.getElementsByClassName("addimg-box")[0].style.visibility = "hidden";
					document.getElementsByClassName("nav-bar")[0].style.display = "none";
					if(gridItem) {
						gridItem.forEach((gi) => {
							gi.style.visibility = "hidden";
						});
					}
					//document.getElementsByClassName("grid-item")[0].style.visibility = "hidden";
					if(document.getElementById("pin-board-img")) {

					document.getElementById("pin-board-img").style.visibility = "hidden";
					}
					addModal.style.opacity = 1;
					let cancelBtn = document.getElementById("cancel-btn");
					console.log(cancelBtn);
					cancelBtn.addEventListener("click", (evt) => {
						console.log("cancel-btn clicked: ", cancelBtn);
						addModal.style.display = "none";
						document.getElementsByClassName("container")[0].style.backgroundColor = "";
						document.getElementsByClassName("user-board-title")[0].style.visibility = "visible";
						document.getElementsByClassName("addimg-box")[0].style.visibility = "visible";
						document.getElementsByClassName("nav-bar")[0].style.display = "flex";
						if(gridItem) {
							gridItem.forEach((gi) => {
								gi.style.visibility = "visible";
							});
						}
						document.getElementsByClassName("grid-item")[0].style.visibility = "visible";
						document.getElementById("pin-board-img").style.visibility = "visible";
					});
				}
			});
		}

	}

//Controls add board button on /dashboard
	let dashWrapper = document.getElementById("dash-container-all");
	if(document.getElementById("add-board")) {
		let addBoard  = document.getElementById("add-board");
		addBoard.addEventListener("click", (evt) => {
			evt.preventDefault();
			let modalBoard = document.getElementsByClassName("modal-board")[0];
			let boardWrap = document.getElementById("board-wrapper");
			document.getElementsByClassName("dash-head")[0].style.visibility = "hidden";
			document.getElementsByClassName("my-boards")[0].style.visibility = "hidden";
			boardWrap.style.display = "flex";
			boardWrap.style.opacity = 1;
			modalBoard.style.opacity = 1;
			document.getElementsByClassName("container")[0].style.backgroundColor ="#444";
			document.getElementById("btn-container").style.display = "none";
			dashWrapper.style.opacity = 1;
			if(document.getElementsByClassName("boardWrap")) {
				let cancelBoard = document.getElementById("cancel-board");
				cancelBoard.addEventListener("click", (evt) => {
					evt.preventDefault();
					boardWrap.style.opacity = "0";
					setTimeout(function(){
						boardWrap.style.display = "none";
						document.getElementsByClassName("container")[0].style.backgroundColor ="";
						document.getElementById("btn-container").style.display = "";
						dashWrapper.style.opacity = 1;
						document.getElementsByClassName("dash-head")[0].style.visibility = "visible";
						document.getElementsByClassName("my-boards")[0].style.visibility = "visible";
					},300);
				});
			}
		});

	}

//Controls saving pin from /catalog
	let catColl = document.getElementsByClassName("cat-img");
	let catalogImage = Array.from(catColl);
	let pinColl = document.getElementsByClassName("pinimg");
	let savePinBtn = Array.from(pinColl);

	catalogImage.forEach((ci, cindex) => {
		savePinBtn.forEach((pin, pindex) => {
			ci.addEventListener("mouseover", (evt) => {
				if(cindex === pindex) {
					pin.style.visibility = "visible";
				}

				setTimeout(function() {
					pin.style.visibility = "hidden";
				}, 2500);
			}, false);
		});
	});


//controls saving pin from /user-board

	let liBoxColl = document.getElementsByClassName("light-box");
	let liBox = Array.from(liBoxColl);

	let gridItColl = document.getElementsByClassName("grid-item");
	let gridItem = Array.from(gridItColl);

	let closeLiBoxColl = document.getElementsByClassName("close-lightbox");
	let closeLiBox = Array.from(closeLiBoxColl);

	let boardColl = document.getElementsByClassName("board-img");
	let boardImage = Array.from(boardColl);
	let uBoardColl = document.getElementsByClassName("boardimg");
	let saveBrdBtn = Array.from(uBoardColl);

	boardImage.forEach((bi, bindex) => {
		saveBrdBtn.forEach((pin, pindex) => {
			bi.addEventListener("mouseover", (evt) => {
				if(bindex === pindex) {
					pin.style.visibility = "visible";
				}

				setTimeout(function() {
					pin.style.visibility = "hidden";
				}, 2500);
			}, false);
		});
	});

liBox.forEach((li, lindex) => {
	boardImage.forEach((bi, bindex) => {
		bi.addEventListener("click", (evt) => {
			evt.preventDefault();
			console.log("bindex: ", bindex);
			console.log("lindex: ", lindex);
			if(bindex === lindex) {
				gridItem.forEach((gi) => {
					gi.style.visibility = "hidden";
				});

				saveBrdBtn.forEach((pin) => {
					pin.style.visibility = "hidden";
				});
				if(document.getElementsByClassName("addimg-box")[0]) {
					document.getElementsByClassName("addimg-box")[0].style.visibility = "hidden";
				}
				document.getElementsByClassName("user-board-title")[0].style.visibility = "hidden";
				document.getElementsByClassName("container")[0].style.backgroundColor = "#444";
				document.getElementById("pin-board-img").style.visibility = "hidden";
				li.style.display = "flex";
			}
		}, false);
	});
});

liBox.forEach((li, lindex) => {
	closeLiBox.forEach((cl, clindex) => {
		cl.addEventListener("click", (evt) => {
			evt.preventDefault();
			if(lindex === clindex) {
				gridItem.forEach((gi) => {
					gi.style.visibility = "visible";
				});

				saveBrdBtn.forEach((pin) => {
					pin.style.visibility = "visible";
				});
				if(document.getElementsByClassName("addimg-box")[0]) {
					document.getElementsByClassName("addimg-box")[0].style.visibility = "visible";
				}
				document.getElementsByClassName("user-board-title")[0].style.visibility = "visible";
				document.getElementsByClassName("container")[0].style.backgroundColor = "";
				document.getElementById("pin-board-img").style.visibility = "visible";
				li.style.display = "none";
			}
		});
	});
});

//Controls warning on /dashboard that user forgot specify or create a new board
if(document.getElementById("err")) {
	setTimeout(function() {
		document.getElementById("err").style.display = "none";
		location.href="/";
	}, 5000);
}



}); //document