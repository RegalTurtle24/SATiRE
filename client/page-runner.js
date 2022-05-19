const pages = document.querySelectorAll(".page");
const translateAmount = 100; 
let translate = 0;

slide = (direction) => {

  direction === "next" ? translate -= translateAmount : translate += translateAmount;
      
  pages.forEach(
    pages => (pages.style.transform = `translateX(${translate}%)`)
  );
}

// Example of how a jumpTo function could work
// New cases could be added to accomadate other pages as long as you record the translate value
jumpTo = (page) => {
  switch (page) {
    case "title":
      translate = 0;
      break;
    case "telephone_settings":
      translate = -400;
      break;
    case "telephone_now_playing":
      translate = -500;
      break;
    case "lobby":
      translate = -300;
      break;
    case "drawing_game_settings":
      translate = -600;
      break;
    case "drawing_game_now_playing":
      translate = -700;
      break;
  }

  pages.forEach(
    pages => (pages.style.transform = `translateX(${translate}%)`)
  );
}

jumpTo('title');
('#p6BackToGameSelect').hide();