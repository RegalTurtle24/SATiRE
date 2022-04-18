const pages = document.querySelectorAll(".page");
const translateAmount = 100; 
let translate = 0;

slide = (direction) => {

  direction === "next" ? translate -= translateAmount : translate += translateAmount;
      
  console.log(pages);
  pages.forEach(
    pages => {pages.style .transform = `translateX(${translate}%)`;
    console.log("lololol");}
  );
  console.log("This works");
}