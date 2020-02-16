# MMM-RVV
Departure monitor for the Regensburger Verkehrsverbund (RVV) bus system (ÖPNV, public transport)

## Installation
1. Navigate into your MagicMirror's modules folder.
2. Execute git clone https://github.com/sebikolon/MMM-RVV.git.
3. Execute cd MMM-RVV.
4. Execute `npm install`.

## Configuration

Sample minimum configuration entry for your ~/MagicMirror/config/config.js:

    ...
    {
		module: "MMM-RVV",
		position: "bottom_right",
		config: {
			title: "RVV - Richtung Stadt",	
			showTitle: true,				
			updateInterval : 1000 *10, 		
			logToConsole : true,			
			tripLimit : 5,					
			displayDirectionLimit: 11,		
			url: "http://www.bayern-fahrplan.de/xhr_departures_monitor?limit=20&zope_command=dm_next&nameInfo_dm=",
			fromName: "Graßer Weg",			
			fromID: 4014037,				
			toName: "Schwabenstraße"						
		}
	}

## Configuration Options
| **Option** | **Default** | **Description** |
| :---: | :---: | --- |
| title | de:8212:89 | <BR>Which stop would you like to have displayed? <BR><EM> Default: Karlsruhe central station (tram stop)</EM><P> |
| showTitle<BR>`optional` | 8 | <BR> How many connections would you like to see? <BR><EM><B>Note</B>: The KVV API limits the maximum number of connections to 10.</EM><P> |
| updateInterval<BR>`optional` |  | <BR> Only show connections for specific lines - use commas to choose multiple lines.<BR><EM> Example values: '3, S1'<BR><B>Note</B>: You <B>can</B> use spaces when setting this parameter in order to enhance legibility.</EM><P> |
| logToConsole <BR>`optional` |  | <BR> There are really "two" stops to every stop, depending on what side of the street you're standing on. You can limit the presented information to one of those "two" stops.<BR> <EM>Possible values: 1, 2</EM><P> |
| labelRow<BR>`optional` | true | <BR> Show or hide column headers<BR> <EM>Possible values: true, false</EM><P> |
| reload<BR>`optional`  | 60000 | <BR> How often should the information be updated? (In milliseconds) <BR><EM> Default: Every minute </EM><P> |
