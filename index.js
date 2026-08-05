require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection
} = require("discord.js");


const client = new Client({

    intents: [

        GatewayIntentBits.Guilds,

        GatewayIntentBits.GuildMembers,

        GatewayIntentBits.GuildMessages,

        GatewayIntentBits.MessageContent,

        GatewayIntentBits.GuildModeration,

        GatewayIntentBits.GuildInvites,

        GatewayIntentBits.GuildVoiceStates,

        GatewayIntentBits.GuildPresences

    ],

    partials: [

        Partials.Message,

        Partials.Channel,

        Partials.GuildMember

    ]

});


// =========================
// Collections
// =========================

client.commands = new Collection();


// =========================
// Event Handler
// =========================

const eventsPath = path.join(__dirname, "events");


if(fs.existsSync(eventsPath)){

    const eventFiles = fs
        .readdirSync(eventsPath)
        .filter(file => file.endsWith(".js"));


    for(const file of eventFiles){

        const filePath = path.join(eventsPath, file);

        const loaded = require(filePath);


        // Supports multiple events in one file
        const events = Array.isArray(loaded)
            ? loaded
            : [loaded];


        for(const event of events){


            if(event.once){

                client.once(
                    event.name,
                    (...args) => event.execute(...args)
                );

            } else {

                client.on(
                    event.name,
                    (...args) => event.execute(...args)
                );

            }


            console.log(`Loaded event: ${event.name}`);

        }

    }

}


// =========================
// Error Handling
// =========================

client.on("error", error => {

    console.error("Discord Client Error:", error);

});


process.on(
    "unhandledRejection",
    error => {

        console.error(
            "Unhandled Promise Rejection:",
            error
        );

    }
);


// =========================
// Login
// =========================

client.login(process.env.TOKEN);