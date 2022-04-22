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
    case "name_select":
      translate = -100;
      break;
  }

  pages.forEach(
    pages => (pages.style.transform = `translateX(${translate}%)`)
  );
}