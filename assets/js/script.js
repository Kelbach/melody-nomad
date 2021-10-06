//ticketmaster key, skyscanner's key is included in fetch
var TMkey = "bKSSMopWAtNQDbL3YZCKcnZyqYR9rgHa"; //user: kevinkelbach
var searchBtn = $('#btn');
var flightPrice = "No flight available";
var originCityAirport = '';

//copied and pasted from developer.ticketmaster
var getShows = (function(band){
    console.log("..fetching tour dates..");
    $.ajax({
        type:"GET",
        //shows limited to US and sorted by date
        url:"https://app.ticketmaster.com/discovery/v2/events?apikey="+TMkey+"&keyword="+band+"&locale=*&sort=date,asc&countryCode=US&includeSpellcheck=yes",
        async:true,
        dataType: "json",
        success: function(json) {
                    console.log(json);
                    //execute display
                    displayShows(json);

                 },
        error: function(xhr, status, err) {
                    //maybe reword this alert
                    alert("There was an error");
                 }
    });
});


var createTableRow = function(showDate, destinationPlace, ticketPrice, flightPrice){
    var tableRow = document.createElement('tr');

    var dateData = document.createElement('td');
    dateData.textContent = showDate;
    tableRow.appendChild(dateData);

    var cityData = document.createElement('td');
    cityData.textContent = destinationPlace;
    tableRow.appendChild(cityData);

    var concertPriceData = document.createElement('td');
    concertPriceData.textContent = "$" + ticketPrice;
    tableRow.appendChild(concertPriceData);

    var flightPriceData = document.createElement('td');
    flightPriceData.textContent = "$" + flightPrice;
    tableRow.appendChild(flightPriceData);

    var totalData = document.createElement('td');
    var total = ticketPrice + flightPrice;
    totalData.textContent = "$" + total;
    tableRow.appendChild(totalData);
    
    $('tbody').append(tableRow);
};



async function displayShows(json) {
    console.log("rendering shows");
    var originPlace = $("#city-search").val().replace(/ /g, "+");
    let originCityData = await getAirportCode(originPlace);
    if (!originCityData || !originCityData.Places || !originCityData.Places[0]){
        originCityAirport = '';
    }
    else{
        originCityAirport = originCityData.Places[0].CityId;
    }
    $("#city-search").attr("data-airport", originCityAirport);

    //need to generate card for upcoming tour dates using for loop,
        //size contains number of object elements ergo shows
    for (var i = 0; i < json.page.size; i++){
        
        var actName = json._embedded.events[i].name;
        var showDate = json._embedded.events[i].dates.start.localDate ;
        var destinationPlace = json._embedded.events[i]._embedded.venues[0].city.name ;
        var ticketLink = json._links.self.href;
        var ticketImageSm = json._embedded.events[i].images[0].url;
        var ticketImageL = json._embedded.events[i].images[4].url;
        var ticketImageXL = json._embedded.events[i].images[5].url;
        var ticketPrice = "";
        
        //error on random ticketLink, images, might need to loops this somehow or just deal with errors
        if (json._embedded.events[i].priceRanges) {
            ticketPrice = json._embedded.events[i].priceRanges[0].min;
        } else {
            console.log("tickets not on sale");
            ticketPrice = "Not on Sale";
        }

        // console.log("////////////////info for event "+(i+1)+"////////////////")
        // console.log("Name: "+actName);
        // console.log("current-city: "+originPlace);
        // console.log("event date: "+showDate);
        // console.log("destination: "+destinationPlace);
        // console.log("tickets starting at: $"+ticketPrice);
        // console.log("Link: "+"https://app.ticketmaster.com/"+ticketLink);
        // console.log("image_url_smol: "+ticketImageSm);
        // console.log("image_url_large: "+ticketImageL);
        // console.log("image_url_xlarge: "+ticketImageXL);

      
        //need to generate plane ticket prices
        var flightPriceData = await getPlaneTicketPrice(originPlace, destinationPlace, showDate);

        if (!flightPriceData || !flightPriceData.Quotes || !flightPriceData.Quotes[0]){
            flightPrice = "No flight available";
        }
        else{
            console.log(flightPriceData);
            console.log(flightPriceData.Quotes);
            console.log(flightPriceData.Quotes[0]);
            flightPrice = flightPriceData.Quotes[0].MinPrice;
        }
        
        createTableRow(showDate, destinationPlace, ticketPrice, flightPrice);
    }
};


async function getAirportCode(cityName) {
    let url = "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/autosuggest/v1.0/UK/GBP/en-GB/?query=" + cityName;

    try {
        let res = await fetch(url, {"method": "GET", "headers": {
            "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
            "x-rapidapi-key": "1658dcf10fmshdb341b964db1078p1016f2jsn3f3f02e49882"
        }})
        return await res.json();
    } catch (error) {
        console.log(error);
    }
}

async function renderAirportCodes(destinationPlace) {
    var originAirport = $("#city-search").attr("data-airport");
    console.log(originAirport);

    let destinationData = await getAirportCode(destinationPlace);
    if (!destinationData || !destinationData.Places || !destinationData.Places[0]){
        return;
    }
    else{
        var destinationAirport = destinationData.Places[0].CityId;
    }

    var airportArray = [originAirport, destinationAirport];
    return airportArray;
}



async function getPlaneTicketPrice(originPlace, destinationPlace, showDate) {
    console.log("..generating airline prices from " + originPlace + " to " + destinationPlace + " with departure date of " + showDate + "..");
    var airportArray = await renderAirportCodes(destinationPlace);
    
    if (!airportArray){
        return;
    }
    else {
        var apiUrl = "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/v1.0/US/USD/en-US/"+airportArray[0]+"/"+airportArray[1]+"/"+showDate+"?inboundpartialdate=2021-10-15";

        try {
            let res = await fetch(apiUrl, {"method": "GET", "headers": {
                "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
                "x-rapidapi-key": "1658dcf10fmshdb341b964db1078p1016f2jsn3f3f02e49882"
            }})
            return await res.json();
        } catch (error) {
            console.log(error);
        }
    };
};


searchBtn.on("click", function(event) {
    event.preventDefault();
    var band = $('#band-search').val().replace(/ /g, "%20"); //regex to replace spaces with usable url symbols
    var city = $("#city-search").val().replace(/ /g, "+"); //this one might give us a hard time, we'll have to look up formatting for SS api

    if (band && city) {
        console.log("I want to see "+band+" and I am from "+city);
        getShows(band);
    } else {
        alert("Please enter the Musician and the City");
    }
});