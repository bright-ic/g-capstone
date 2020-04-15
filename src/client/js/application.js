/* Global Variables */
const geoname_username = "onwukweb";//"glo123";
const geoname_url = `http://api.geonames.org/searchJSON?username=${geoname_username}&name_equals=`;
const weatherbit_api_key = "be2a81e2c3f648f4b77b3cbb185ef0b7";
const weatherbit_url = `https://api.weatherbit.io/v2.0/forecast/daily/?key=${weatherbit_api_key}`;
const pixabay_api_key = "16037713-5375c9610a462188b390e0c64";
const pixabay_url = `https://pixabay.com/api/?key=${pixabay_api_key}`;

let api_response = { error: false, message: "", data: null };

export const global_data = {
  travel_data: {},
  is_savable: false
};

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
/**
 * @description Helper function that gets the difference in days between two dates
 * @param {string} startDate - a date string less than endDate
 * @param {string} endDate - a future date
 * @returns {number} the difference in days between two dates
 */
 export const get_num_days_apart_in_dates = (startDate, endDate) => {
  const dateObj1 = new Date(startDate);
  const dateObj2 = new Date(endDate);

  let Difference_In_Time = dateObj2.getTime() - dateObj1.getTime();
  let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);
  return Difference_In_Days;
}
/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */
/**
 * @description A function that returns the current date in this format yyyy-mm-dd
 * @returns {string} date string
 */
 const getTodaysDate = () => {
  let today = new Date();
  return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
}

/**  
 * @description helper function that retrieves future weather forcast
 * @param {string} lat - latitude (of the location/position of the city)
 * @param {string} lng - longitude (of the location/position of the city)
 * @param {string} departure_date - travel departure date
 * @param {string} return_date - travel return date
 * @returns {object} on success weather forcast data eg {error:false, message:"success", data:{...}, departureDat:number}
 * @returns {object} on failure  eg {error:true, message:"....", data:null, departureDat:1}
*/
const fetch_weather_forcast_by_geo = async ( lat, lng, departure_date, return_date ) => {
  let response = { error: false, message: '', data: null, departureDay: 1 };
  let today = getTodaysDate();
  let travel_duration = get_num_days_apart_in_dates(departure_date, return_date===""? departure_date: return_date);
  let no_of_days_to_travel_date = parseInt(get_num_days_apart_in_dates(today, departure_date));
  try {
    // only i6 days into the future weather can be retrieved
    if (no_of_days_to_travel_date > 16) {
      throw new Error("Sorry! We can only get weather forcast for the next 16 days.");
    }
    travel_duration = travel_duration !== "" && travel_duration > 0 ? parseInt(travel_duration) : 0;
    let dday = no_of_days_to_travel_date;
    if (no_of_days_to_travel_date < 1) {
      if (departure_date === return_date) {
        no_of_days_to_travel_date = 1;
        response.departureDay = 0;
      }
      else {
        no_of_days_to_travel_date = travel_duration + 1;
        response.departureDay = 0;
      }
    }
    else {
      no_of_days_to_travel_date = no_of_days_to_travel_date + 1 + travel_duration;
      response.departureDay = dday;
    }
    
    response.travel_duration = travel_duration;
    let res = await fetch(`${weatherbit_url}&lat=${lat}&lon=${lng}&days=${no_of_days_to_travel_date}`);
    res = await res.json();
    response.data = typeof res.data !== "undefined" && Array.isArray(res.data) && res.data.length > 0 ? res.data : null;
    response.message = "success";
    return response;
  }
  catch (err) {
    return { ...response, error: true, message: err.message };
  }
}

/**
 * @description helper function that fetches the picture of the city/country the user is traveling to using pixabay api
 * @param {string} city - city the user is plaining to travel to (required)
 * @param {string} country - the country the city is located in
 * @returns {Array} pictures of the city user is traveling to
*/
export const get_pictures_of_travel_city = async (city, country) => {
  let response = api_response;
  try {
    let is_country_photo_searched = false;
    let url = `${pixabay_url}&image_type=photo&q=${encodeURIComponent(city)}&orientation=vertical`;
    let res = await fetch(url);
    res = await res.json();
    response.data = res.totalHits > 0 ? res.hits : null;
    if(response.data === null && !is_country_photo_searched) { // no photo was returned for the city user selected
      // search for a any photo of the county
      is_country_photo_searched = true;
      url = `${pixabay_url}?&image_type=photo&q=${encodeURIComponent(country)}&orientation=vertical`;
      res = await fetch(url);
      res = await res.json();
      response.data = res.totalHits > 0 ? res.hits : null;
    }
    response.message = "success";
    return response;
  }
  catch (err) {
    return { ...response, error: true, message: err.message };
  }
}

/**  
 * @description function that searches for city data using geoname api
 * @param {string} city - the city user wants to find information abaout.
 * @returns {object} city details or null if nothing was returned
*/
const find_city = async (city) => {
  try {
    
    let res = await fetch(geoname_url + city);
    res = await res.json();
    let data = res.geonames.length > 0 ? res.geonames[0] : null;
    return data;
  }
  catch (err) {
    console.log(err);
    return "FAILED";
  }
}

const show_plan = (evt) => {
  let id = evt.target.dataset.id;
  let data = {[id]: {...global_data.travel_data[id]}};
  if(document.querySelectorAll(".active_button")) {
    document.querySelectorAll(".active_button").forEach(function(node) {
      node.className = "";
    });
  }
  evt.target.className = "active_button";
  update_page_ui(data, "detail_page");
}

const list_saved_travel_plans = (data) => {
  let plan_list_container = document.querySelector(".plan_list_container");
  //plan_list_container.innerHTML = "going";
  let travel_plans = Object.entries(data);
  if(travel_plans.length > 0){
    const list = document.createDocumentFragment();
    for(let travel_plan of travel_plans) {
      const [id, plan] = travel_plan;
      const planHTML = document.createElement('div');
      planHTML.className = "plan_item";
      planHTML.innerHTML = ``;
      planHTML.dataset.id = plan.id;
      planHTML.textContent = plan.location.name + " ( "+plan.departure_date+" )";
      planHTML.addEventListener("click", show_plan);
      list.appendChild(planHTML);
    }

    plan_list_container.innerHTML = "<h2>Your Travel List</h2>";
    plan_list_container.appendChild(list);

  }
}

/** 
 * @description Helper function that updates ui with travel plans info and weather forcast
 * @param {object} plans - represents key value pairs of different travel/trip plans data
 * @param {string} containerElementId - id of the DOM element to append the dynamicclly created elements to
 * @param {string} from - identifies which part of the code is calling this helper function eg. my trips page or add trip (home page)
*/
export const update_page_ui = async (travel_data = {}, containerElementId = "", from="") => {
  travel_data = Object.entries(travel_data);
  if(travel_data.length === 0) {
    if(from === "") {
      alert("Nothing to update");
    }
    return;
  }

  if(document.querySelector(".section_heading_image")) {
    document.querySelector(".section_heading_image").textContent = "Image Grid";
  }
  if(document.querySelector(".section_heading_forcast")) {
    document.querySelector(".section_heading_forcast").textContent = "Forecast";
  }

  for(let data of travel_data) {
    const [id, plan] = data;
    let today = getTodaysDate();
    let no_of_days_to_travel_date = parseInt(get_num_days_apart_in_dates(today, plan.departure_date));
    // update the ui with images of the city
    const imageGrid = document.createDocumentFragment();
    if(!plan.pictures_of_city.error && plan.pictures_of_city.data) {
      const num_pics_to_display =  plan.pictures_of_city.data.length > 10 ? 9 :  plan.pictures_of_city.data.length - 1;
      for(let i=0; i <= num_pics_to_display; i++) {
        let city_picture =  plan.pictures_of_city.data[i].webformatURL;
        const imgTag = document.createElement('img');
        imgTag.src = city_picture;
        imgTag.alt = plan.pictures_of_city.data[i].tags;
        const img_container_div = document.createElement("div");
        img_container_div.appendChild(imgTag);
        imageGrid.appendChild(img_container_div);
      }
    }

    const conuntry_detail_container = document.createElement("div");
    conuntry_detail_container.className = "city_detail_con";
    conuntry_detail_container.innerHTML = `<p class="city_detail_holder">Country: ${plan.location.countryName}<br>City: ${plan.location.name}<br>Population: ${plan.location.population === 0 ? "N/A" : plan.location.population}<br>Travel Date: ${plan.departure_date}<br/>Duration of travel : ${plan.duration} days<br/> ${no_of_days_to_travel_date < 0 ? "Your have made this trip" : no_of_days_to_travel_date === 0 ? "You are departing today" : `You are departing in ${no_of_days_to_travel_date} ${no_of_days_to_travel_date === 1 ? "day" : "days"} time`}</p>`;

    const image_grid_doc_frag = document.createDocumentFragment();
    image_grid_doc_frag.appendChild(conuntry_detail_container);
    image_grid_doc_frag.appendChild(imageGrid);
    document.querySelector(".image_grid_container").innerHTML = "";
    document.querySelector(".image_grid_container").appendChild(image_grid_doc_frag);

    // update ui with weather forcast
    let weatherHtml = "Nothing to display. Could it be that your departure date is passsed?";
    
    if(no_of_days_to_travel_date >= 0) {
      weatherHtml = "";
      if(plan.weather !== null && Object.values(plan.weather).length > 0 ) {
        const weather_arr = Object.values(plan.weather);
        for(let i=0; i <= weather_arr.length - 1; i++) {
          // only show weather from the departure day
          if(i => no_of_days_to_travel_date) {
            const weather = weather_arr[i];
            weatherHtml = weatherHtml + `<p><img src="https://img.icons8.com/cute-clipart/24/000000/cloud.png" /> ${weather.weather.description}</p>
              <p class="p2">Temperature: ${weather.temp}°C | High Temp: ${weather.high_temp} | Low Temp: ${weather.low_temp} | Snow: ${weather.snow} | Wind Dir: ${weather.wind_cdir} | Wind Speed: ${weather.wind_spd} | Date: ${weather.valid_date} </p>`;
          }
        }
      }
    }

    document.querySelector(".weather_container").innerHTML = weatherHtml;
  }
}



export const process_submit = async (city, departure, return_date) => {
 
 try {
  const city_resp = await find_city(city);
  if (city_resp === "FAILED") {
    throw new Error("Sorry! Something wrong.");
  }
  if (city_resp === null) {
    throw new Error("Could not find city location");
  }
  const weather = await fetch_weather_forcast_by_geo(city_resp.lat, city_resp.lng, departure, return_date);
  const pictures_of_city = await get_pictures_of_travel_city(city, city_resp.countryName);

  if (weather.error) alert(weather.message);
  const travel_data = {
    id: Date.now(),
    duration: weather.travel_duration,
    return_date,
    departure_date : departure,
    location: {...city_resp},
    weather: {...weather.data},
    pictures_of_city: {...pictures_of_city}
  }
  global_data.travel_data = {};
  global_data.travel_data[travel_data.id] = travel_data;
  global_data.is_savable = true;
  update_page_ui(global_data.travel_data, "detail_page");
  return;
 }
 catch(err) {
   alert(err.message);
 }
}

/**
 * @description Helper function that retrieves travels plans from localstorage (ie plans that were saved before)
 * @param {string} key - contains the key of the item to be retrieved from localstorage
 * @returns {object} on success
 * @returns {null} on failure
 */
 const get_travel_plan_from_storage = (key) => {
  let data = localStorage.getItem(key);
  if(data === null) data = null;
  else data = JSON.parse(data);

  return data;
}

export const save_trip_handler = (evt) => {
  evt.preventDefault();
  let travel_plan = Object.values(global_data.travel_data);
  if(!global_data.is_savable) {
    alert("No new item to save");
    return;
  }
  if(global_data.is_savable && travel_plan.length > 0) {
    if(!window.localStorage) {
      alert("Sorry! We could not process your request. Upgrade your browser before you can save");
      return false;
    }
    travel_plan = travel_plan[0];
    let plans = get_travel_plan_from_storage("travel_data");
    if(plans === null)  plans = {};
    plans[travel_plan.id] = travel_plan;
  
    try {
      // add to storage
      const updated_travel_data = JSON.stringify(plans);
      localStorage.setItem("travel_data", updated_travel_data);
      global_data.is_savable = false;
      alert("saved successfully!");
    }
    catch (err) {
      alert(err.message);
    }
  }
}

export const view_saved_trip_handler = (evt) => {
  evt.preventDefault();
  global_data.is_savable = false;
  let travel_data = get_travel_plan_from_storage("travel_data");
  if(travel_data === null) {
    alert("You have no saved trip");
    return;
  }
  global_data.travel_data = travel_data;
  document.querySelector(".image_grid_container").innerHTML = "";
  document.querySelector(".weather_container").innerHTML = "";
  if(document.querySelector(".section_heading_image")) {
    document.querySelector(".section_heading_image").textContent = "";
  }
  if(document.querySelector(".section_heading_forcast")) {
    document.querySelector(".section_heading_forcast").textContent = "";
  }
  list_saved_travel_plans(travel_data);
}


export const init_submit = (e) => {
  e.preventDefault();
  let city = document.querySelector(".city").value;
  let departure_date = document.querySelector(".departure_date").value;
  let return_date = document.querySelector(".return_date").value;
  
  // validation
  if(city === "") {
    alert("Please enter city name");
    return;
  }
  if(departure_date === "") {
    alert("Please enter date of departure");
    return;
  }
  let redirect_url = "";
  if(process.env.NODE_ENV === "production") {
     redirect_url = "/details?city="+encodeURIComponent(city)+"&departure_date="+encodeURIComponent(departure_date);
  }
  else {
     redirect_url = "/details.html?city="+encodeURIComponent(city)+"&departure_date="+encodeURIComponent(departure_date);
  }
  if(return_date !== "") {
    redirect_url = redirect_url + "&return_date="+encodeURIComponent(return_date);
  }

  //redirect user to detail page;
  location.href = redirect_url;
}