// import styles
import "./styles/style.scss";
import "./styles/style1.scss";

// import js
import {init_submit, process_submit, save_trip_handler, view_saved_trip_handler} from "./js/application";

if(document.querySelector(".form")) {
  document.querySelector(".form").addEventListener("submit", init_submit);
}

if(document.getElementById("save_trip")) {
  document.getElementById("save_trip").addEventListener("click", save_trip_handler);
}

if(document.getElementById("view_saved_trip")) {
  document.getElementById("view_saved_trip").addEventListener("click", view_saved_trip_handler);
}

if(window.location.search !== "") {
  const url_string = window.location.href;
  const url = new URL(url_string);
  const city = url.searchParams.get("city");
  const departure_date = url.searchParams.get("departure_date");
  let return_date = "";
  if(url.searchParams.get("return_date")) {
    return_date = url.searchParams.get("return_date");
  }
  if(city !=="" && departure_date !== "") {
    process_submit(city, departure_date, return_date);
  }
}
else {
  if(document.querySelector(".image_grid_container")) {
    document.querySelector(".image_grid_container").textContent = "";
  }
}