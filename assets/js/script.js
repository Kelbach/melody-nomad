//ticketmaster key, skyscanner's key is included in fetch
var TMkey = "bKSSMopWAtNQDbL3YZCKcnZyqYR9rgHa"; //user: kevinkelbach
var searchBtn = $('#btn');
var flightPrice = "No flight available";
var originCityAirport = '';
var prevShows = JSON.parse(localStorage.getItem('prevShows')) || [];

//function to generate previously clicked tickets into footer
var docReady = (function() {
    $("#recent-images").html("");
    for (var i = 0; i < prevShows.length/2; i++) {
        var searched = $("<div>").addClass("col-2").html("<a href='"+prevShows[2*i+1]+"' target='_blank'><img class='btm-img' src='"+prevShows[2*i]+"' /></a>");
        $("#recent-images").append(searched);
    }
});

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
                    $("#warning").text("..Shows found..");
                    //execute display
                    displayShows(json);
                    
                 },
        error: function(xhr, status, err) {
                    //maybe reword this alert
                    $("#warning").text("There was an error");
                 }
    });
});


var createTableRow = function(actName, showDate, destinationPlace, ticketPrice, flightPrice, flightLink, ticketImage, ticketLink){
    
    //added class='air-ticket' to the airline ticket so we can append a link to it later
    //background transparent for background image to shine through
    
    var card = $("<div>").addClass("row .bg-transparent");
    var imageContainer = $("<div>").addClass("col-4-img").html("<a href='"+ticketLink+"' target='_blank'><img src='"+ticketImage+"' /></a>");
    
    //adds listener to image to save the show clicked
    imageContainer.on("click", function(event){
        if(prevShows.indexOf(ticketLink) === -1) {
            prevShows.push(ticketImage, ticketLink);
            localStorage.setItem('prevShows', JSON.stringify(prevShows));

            if(prevShows.length > 17) {
                var firstShow = prevShows.splice(0, 2);
                localStorage.setItem('prevShows', JSON.stringify(prevShows));
            }
            docReady();
        }
        
    });

    var infoContainer = $("<div>").addClass("col-8-img");
    var cardTitle = $("<div>").addClass("row").html("<a href='"+ticketLink+"' target='_blank'><h2>"+actName+"</h2></a>");
    
    //adds listener to cardTitle to save show clicked
    cardTitle.on("click", function(event){
        if(prevShows.indexOf(ticketLink) === -1) {
            prevShows.push(ticketImage, ticketLink);
            localStorage.setItem('prevShows', JSON.stringify(prevShows));
            
            if(prevShows.length > 17) {
                var firstShow = prevShows.splice(0, 2);
                localStorage.setItem('prevShows', JSON.stringify(prevShows));
            }
            docReady();
        }
    });

    var list = $("<ul>").addClass("list-group");
    var date = $("<li>").addClass("list-group-item").text(showDate);
    var location = $("<li>").addClass("list-group-item").text(destinationPlace);
    var showPrice = $("<li>").addClass("list-group-item").text("Show Tickets starting at: "+ticketPrice);
    var airPrice = $("<li>").addClass("list-group-item air-ticket");
    if(flightLink && flightPrice != "No flight available"){
        airPrice.html("<a href='"+flightLink+"' target='_blank'>Flights starting at: "+flightPrice+"</a>");
    } 
    else {
        airPrice.text("Flights starting at: "+flightPrice);
    }

    $("#shows").append(card.append(imageContainer).append(infoContainer.append(cardTitle).append(list.append(date).append(location).append(showPrice).append(airPrice))));
};



async function displayShows(json) {

    $("#shows").html(""); //this clears previous shows
    $("#city-search").attr("data-airport", ''); //clear previous airport name

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
    for (var i = 0; i < json.page.totalElements; i++){
        if (i === 20) {
            break
        }

        if(!json._embedded){
            $("#warning").text('No upcoming events for that musician');
            return;
        } else {
            $("#warning").text("..Displaying shows..");
        }

        var actName = json._embedded.events[i].name;
        var showDate = json._embedded.events[i].dates.start.localDate ;
        var destinationPlace = json._embedded.events[i]._embedded.venues[0].city.name ;
        var ticketLink = json._embedded.events[i].url;
        var ticketImage = json._embedded.events[i].images[0].url;
        var ticketPrice = "";
        
        if (json._embedded.events[i].priceRanges) {
            ticketPrice = "$" + json._embedded.events[i].priceRanges[0].min;
        } else {
            ticketPrice = "Not on Sale";
        }

        



        //READY FOR APPENDING
      
        //need to generate plane ticket prices
        var flightPriceData = await getPlaneTicketPrice(originPlace, destinationPlace, showDate);
        console.log(flightPriceData);

        if (!flightPriceData || !flightPriceData.Quotes || !flightPriceData.Quotes[0]){
            flightPrice = "No flight available";
        }
        else{
            flightPrice = "$" + flightPriceData.Quotes[0].MinPrice;
            console.log(flightPriceData.flightLink);
            if (flightPriceData.flightLink){
                var flightLink = flightPriceData.flightLink;
            }
        }
        
        createTableRow(actName, showDate, destinationPlace, ticketPrice, flightPrice, flightLink, ticketImage, ticketLink);
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
    console.log("..generating airline prices from " + originPlace+" to " + destinationPlace + " with departure date of " + showDate + "..");
    var departureDate = moment(showDate, "YYYY-MM-DD").subtract(1, 'days').format("YYYY-MM-DD");
    var returnDate = moment(showDate, "YYYY-MM-DD").add(1, 'days').format("YYYY-MM-DD");

    var airportArray = await renderAirportCodes(destinationPlace);
    
    if (!airportArray || airportArray[0] == '-sky' || airportArray[1]  == '-sky'){
        return;
    }
    else {
        var apiUrl = "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/v1.0/US/USD/en-US/"+airportArray[0]+"/"+airportArray[1]+"/"+departureDate+"?inboundpartialdate="+returnDate;
        var flightLink = "https://www.skyscanner.com/transport/flights/"+airportArray[0].split('-')[0]+"/"+airportArray[1].split('-')[0]+"/"+moment(departureDate, "YYYY-MM-DD").format("YYMMDD")+"/"+moment(returnDate, "YYYY-MM-DD").format("YYMMDD")+"/";

        try {
            let res = await fetch(apiUrl, {"method": "GET", "headers": {
                "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
                "x-rapidapi-key": "1658dcf10fmshdb341b964db1078p1016f2jsn3f3f02e49882"
            }})
            var flightJson = await res.json()
            flightJson["flightLink"] = flightLink;
            return await flightJson;
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
        $("#warning").text("..Getting shows..")
        getShows(band);
    } else {
        $("#warning").text("!!Please enter the Musician and the City!!")
        // alert("Please enter the Musician and the City");
    }
});

docReady();