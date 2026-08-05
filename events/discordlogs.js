const {
    EmbedBuilder,
    AuditLogEvent
} = require("discord.js");

const { sendLog } = require("../utils/logs");


const DEFAULT_LOGS = "1200188321951924264";
const BAN_LOGS = "1534608390221856768";
const INVITE_LOGS = "1534608280457056357";
const VOICE_LOGS = "1534624514602963306";



/*
=================================================
            RYDER CORE EMBED SYSTEM
=================================================
*/


function eventID(prefix){

    return `${prefix}-${Math.floor(
        10000 + Math.random() * 90000
    )}`;

}



function createEmbed(
    guild,
    {
        category,
        title,
        description,
        fields = [],
        color = "#4B5563",
        idPrefix = "SYS"
    }
){


    const embed =
    new EmbedBuilder()


    .setColor(color)


    .setAuthor({

        name:
        `RYDER CORE  /  ${category}`,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    })


    .setTitle(title)


    .setDescription(
`
${description || "Automated monitoring record."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    );



    /*
        Make everything horizontal.
        Every field is inline.
    */


    for(const field of fields){

        embed.addFields({

            name:
            field.name,

            value:
            field.value || "N/A",

            inline:true

        });

    }



    embed.addFields({

        name:
        " ",
        
        value:
`
\`EVENT\`
${eventID(idPrefix)}

\`STATUS\`
Completed
`,
        inline:false

    });



    embed.setFooter({

        text:
        `RB CORE • Private Infrastructure • ${guild.name}`,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    });


    embed.setTimestamp();



    return embed;

}





async function getExecutor(
    guild,
    type,
    targetId
){

    try {


        const logs =
        await guild.fetchAuditLogs({

            limit:10,
            type

        });



        const entry =
        logs.entries.find(

            e =>
            e.target?.id === targetId &&
            Date.now() - e.createdTimestamp < 15000

        );



        if(entry){


            return {

                user:
                entry.executor
                ?
                `<@${entry.executor.id}>`
                :
                "Unknown",


                reason:
                entry.reason ||
                "No reason provided"

            };


        }


    } catch(error){

        console.log(
            "Audit Error:",
            error
        );

    }



    return {

        user:"Unknown",

        reason:"No reason provided"

    };

}





/*
=================================================
              MESSAGE EVENTS
=================================================
*/


async function messageDelete(message){


    if(!message.guild) return;
    if(message.author?.bot) return;



    sendLog(

        message.guild,

        DEFAULT_LOGS,

        createEmbed(

            message.guild,

            {

                category:
                "MESSAGE SYSTEM",

                title:
                "🗑 Message Deleted",

                description:
                "A message was removed from the server.",


                fields:[

                    {
                        name:
                        "👤 MEMBER",

                        value:
                        `<@${message.author.id}>`
                    },


                    {
                        name:
                        "📍 CHANNEL",

                        value:
                        `${message.channel}`
                    },


                    {
                        name:
                        "💬 CONTENT",

                        value:
                        message.content
                        ?
                        message.content.slice(0,900)
                        :
                        "No content"
                    }

                ],


                color:
                "#64748B",

                idPrefix:
                "MSG"

            }

        )

    );

}




async function messageUpdate(
    oldMessage,
    newMessage
){


    if(!oldMessage.guild) return;
    if(oldMessage.author?.bot) return;


    if(
        oldMessage.content ===
        newMessage.content
    ) return;




    sendLog(

        oldMessage.guild,

        DEFAULT_LOGS,

        createEmbed(

            oldMessage.guild,

            {

                category:
                "MESSAGE SYSTEM",

                title:
                "✏ Message Updated",

                description:
                "A message was edited.",


                fields:[


                    {
                        name:
                        "👤 MEMBER",

                        value:
                        `<@${oldMessage.author.id}>`
                    },


                    {
                        name:
                        "📍 CHANNEL",

                        value:
                        `${oldMessage.channel}`
                    },


                    {
                        name:
                        "⬅ BEFORE",

                        value:
                        oldMessage.content
                        ?
                        oldMessage.content.slice(0,500)
                        :
                        "Empty"
                    },


                    {
                        name:
                        "➡ AFTER",

                        value:
                        newMessage.content
                        ?
                        newMessage.content.slice(0,500)
                        :
                        "Empty"
                    }


                ],


                color:
                "#5865F2",

                idPrefix:
                "MSG"

            }

        )

    );

}





/*
=================================================
             MEMBER EVENTS
=================================================
*/


async function guildMemberUpdate(
    oldMember,
    newMember
){


    if(
        !oldMember.communicationDisabledUntil &&
        newMember.communicationDisabledUntil
    ){


        const audit =
        await getExecutor(

            newMember.guild,

            AuditLogEvent.MemberUpdate,

            newMember.id

        );



        sendLog(

            newMember.guild,

            BAN_LOGS,

            createEmbed(

                newMember.guild,

                {

                    category:
                    "MODERATION SYSTEM",

                    title:
                    "⏳ Member Timeout",


                    fields:[

                        {
                            name:
                            "👤 MEMBER",

                            value:
                            `<@${newMember.id}>`
                        },


                        {
                            name:
                            "⏰ EXPIRES",

                            value:
                            `<t:${Math.floor(
                            newMember.communicationDisabledUntilTimestamp / 1000
                            )}:R>`
                        },


                        {
                            name:
                            "🛡 AUTHORIZED BY",

                            value:
                            audit.user
                        }

                    ],


                    color:
                    "#F59E0B",

                    idPrefix:
                    "MOD"

                }

            )

        );


        return;

    }


}

/*
=================================================
                 ROLE SYSTEM
=================================================
*/


async function roleCreate(role){


    const audit =
    await getExecutor(

        role.guild,

        AuditLogEvent.RoleCreate,

        role.id

    );



    sendLog(

        role.guild,

        DEFAULT_LOGS,

        createEmbed(

            role.guild,

            {

                category:
                "ROLE SYSTEM",

                title:
                "🎭 Role Created",

                description:
                "A new server role has been created.",


                fields:[

                    {
                        name:
                        "🎭 ROLE",

                        value:
                        `\`${role.name}\``
                    },


                    {
                        name:
                        "🛡 CREATED BY",

                        value:
                        audit.user
                    },


                    {
                        name:
                        "🆔 ROLE ID",

                        value:
                        `\`${role.id}\``
                    }

                ],


                color:
                "#22C55E",

                idPrefix:
                "ROLE"

            }

        )

    );

}





async function roleDelete(role){


    const audit =
    await getExecutor(

        role.guild,

        AuditLogEvent.RoleDelete,

        role.id

    );



    sendLog(

        role.guild,

        DEFAULT_LOGS,

        createEmbed(

            role.guild,

            {

                category:
                "ROLE SYSTEM",

                title:
                "🗑 Role Deleted",

                description:
                "A server role has been removed.",


                fields:[

                    {
                        name:
                        "🎭 ROLE",

                        value:
                        `\`${role.name}\``
                    },


                    {
                        name:
                        "🛡 DELETED BY",

                        value:
                        audit.user
                    },


                    {
                        name:
                        "🆔 ROLE ID",

                        value:
                        `\`${role.id}\``
                    }

                ],


                color:
                "#EF4444",

                idPrefix:
                "ROLE"

            }

        )

    );

}





async function roleUpdate(
    oldRole,
    newRole
){


    if(
        oldRole.name ===
        newRole.name
    ) return;



    const audit =
    await getExecutor(

        newRole.guild,

        AuditLogEvent.RoleUpdate,

        newRole.id

    );



    sendLog(

        newRole.guild,

        DEFAULT_LOGS,

        createEmbed(

            newRole.guild,

            {

                category:
                "ROLE SYSTEM",

                title:
                "✏ Role Updated",

                description:
                "A role configuration was changed.",


                fields:[

                    {
                        name:
                        "⬅ BEFORE",

                        value:
                        oldRole.name
                    },


                    {
                        name:
                        "➡ AFTER",

                        value:
                        newRole.name
                    },


                    {
                        name:
                        "🛡 UPDATED BY",

                        value:
                        audit.user
                    }

                ],


                color:
                "#5865F2",

                idPrefix:
                "ROLE"

            }

        )

    );

}





/*
=================================================
                CHANNEL SYSTEM
=================================================
*/


async function channelCreate(channel){


    if(!channel.guild) return;



    const audit =
    await getExecutor(

        channel.guild,

        AuditLogEvent.ChannelCreate,

        channel.id

    );



    sendLog(

        channel.guild,

        DEFAULT_LOGS,

        createEmbed(

            channel.guild,

            {

                category:
                "SERVER SYSTEM",

                title:
                "📂 Channel Created",

                description:
                "A new channel was created.",


                fields:[

                    {
                        name:
                        "📂 CHANNEL",

                        value:
                        `${channel}`
                    },


                    {
                        name:
                        "🛡 CREATED BY",

                        value:
                        audit.user
                    },


                    {
                        name:
                        "🆔 CHANNEL ID",

                        value:
                        `\`${channel.id}\``
                    }

                ],


                color:
                "#22C55E",

                idPrefix:
                "CHAN"

            }

        )

    );

}





async function channelDelete(channel){


    if(!channel.guild) return;



    const audit =
    await getExecutor(

        channel.guild,

        AuditLogEvent.ChannelDelete,

        channel.id

    );



    sendLog(

        channel.guild,

        DEFAULT_LOGS,

        createEmbed(

            channel.guild,

            {

                category:
                "SERVER SYSTEM",

                title:
                "🗑 Channel Deleted",

                description:
                "A channel was removed.",


                fields:[

                    {
                        name:
                        "📂 CHANNEL",

                        value:
                        `\`${channel.name}\``
                    },


                    {
                        name:
                        "🛡 DELETED BY",

                        value:
                        audit.user
                    },


                    {
                        name:
                        "🆔 CHANNEL ID",

                        value:
                        `\`${channel.id}\``
                    }

                ],


                color:
                "#EF4444",

                idPrefix:
                "CHAN"

            }

        )

    );

}





async function channelUpdate(
    oldChannel,
    newChannel
){


    if(
        oldChannel.name ===
        newChannel.name
    ) return;



    const audit =
    await getExecutor(

        newChannel.guild,

        AuditLogEvent.ChannelUpdate,

        newChannel.id

    );



    sendLog(

        newChannel.guild,

        DEFAULT_LOGS,

        createEmbed(

            newChannel.guild,

            {

                category:
                "SERVER SYSTEM",

                title:
                "✏ Channel Updated",

                description:
                "A channel setting was modified.",


                fields:[

                    {
                        name:
                        "⬅ BEFORE",

                        value:
                        oldChannel.name
                    },


                    {
                        name:
                        "➡ AFTER",

                        value:
                        newChannel.name
                    },


                    {
                        name:
                        "🛡 UPDATED BY",

                        value:
                        audit.user
                    }

                ],


                color:
                "#5865F2",

                idPrefix:
                "CHAN"

            }

        )

    );

}





/*
=================================================
              MODERATION SYSTEM
=================================================
*/


async function guildBanAdd(ban){


    const audit =
    await getExecutor(

        ban.guild,

        AuditLogEvent.MemberBanAdd,

        ban.user.id

    );



    sendLog(

        ban.guild,

        BAN_LOGS,

        createEmbed(

            ban.guild,

            {

                category:
                "MODERATION SYSTEM",

                title:
                "🔨 Member Banned",

                description:
                "A member was banned from the server.",


                fields:[

                    {
                        name:
                        "👤 MEMBER",

                        value:
                        `<@${ban.user.id}>`
                    },


                    {
                        name:
                        "📝 REASON",

                        value:
                        audit.reason
                    },


                    {
                        name:
                        "🛡 AUTHORIZED BY",

                        value:
                        audit.user
                    }


                ],


                color:
                "#EF4444",

                idPrefix:
                "BAN"

            }

        )

    );

}





async function guildBanRemove(ban){


    const audit =
    await getExecutor(

        ban.guild,

        AuditLogEvent.MemberBanRemove,

        ban.user.id

    );



    sendLog(

        ban.guild,

        BAN_LOGS,

        createEmbed(

            ban.guild,

            {

                category:
                "MODERATION SYSTEM",

                title:
                "🔓 Member Unbanned",

                description:
                "A member ban was removed.",


                fields:[

                    {
                        name:
                        "👤 MEMBER",

                        value:
                        `<@${ban.user.id}>`
                    },


                    {
                        name:
                        "🛡 AUTHORIZED BY",

                        value:
                        audit.user
                    }

                ],


                color:
                "#22C55E",

                idPrefix:
                "BAN"

            }

        )

    );

}

 
/*
=================================================
                 INVITE SYSTEM
=================================================
*/


async function inviteCreate(invite){


    sendLog(

        invite.guild,

        INVITE_LOGS,

        createEmbed(

            invite.guild,

            {

                category:
                "INVITE SYSTEM",

                title:
                "🔗 Invite Created",

                description:
                "A new server invite was generated.",


                fields:[

                    {
                        name:
                        "🔗 CODE",

                        value:
                        `\`${invite.code}\``
                    },


                    {
                        name:
                        "📍 CHANNEL",

                        value:
                        `${invite.channel}`
                    },


                    {
                        name:
                        "👤 CREATOR",

                        value:
                        `${invite.inviter || "Unknown"}`
                    }

                ],


                color:
                "#22C55E",

                idPrefix:
                "INV"

            }

        )

    );

}





async function inviteDelete(invite){


    sendLog(

        invite.guild,

        INVITE_LOGS,

        createEmbed(

            invite.guild,

            {

                category:
                "INVITE SYSTEM",

                title:
                "🗑 Invite Deleted",

                description:
                "A server invite was removed.",


                fields:[

                    {
                        name:
                        "🔗 CODE",

                        value:
                        `\`${invite.code}\``
                    }

                ],


                color:
                "#EF4444",

                idPrefix:
                "INV"

            }

        )

    );

}





/*
=================================================
                 THREAD SYSTEM
=================================================
*/


async function threadCreate(thread){


    if(!thread.guild) return;



    const audit =
    await getExecutor(

        thread.guild,

        AuditLogEvent.ThreadCreate,

        thread.id

    );



    sendLog(

        thread.guild,

        DEFAULT_LOGS,

        createEmbed(

            thread.guild,

            {

                category:
                "SERVER SYSTEM",

                title:
                "🧵 Thread Created",

                description:
                "A new thread was opened.",


                fields:[

                    {
                        name:
                        "🧵 THREAD",

                        value:
                        `\`${thread.name}\``
                    },


                    {
                        name:
                        "🛡 CREATED BY",

                        value:
                        audit.user
                    }

                ],


                color:
                "#22C55E",

                idPrefix:
                "THRD"

            }

        )

    );

}





async function threadDelete(thread){


    if(!thread.guild) return;



    const audit =
    await getExecutor(

        thread.guild,

        AuditLogEvent.ThreadDelete,

        thread.id

    );



    sendLog(

        thread.guild,

        DEFAULT_LOGS,

        createEmbed(

            thread.guild,

            {

                category:
                "SERVER SYSTEM",

                title:
                "🗑 Thread Deleted",

                description:
                "A thread was removed.",


                fields:[

                    {
                        name:
                        "🧵 THREAD",

                        value:
                        `\`${thread.name}\``
                    },


                    {
                        name:
                        "🛡 DELETED BY",

                        value:
                        audit.user
                    }

                ],


                color:
                "#EF4444",

                idPrefix:
                "THRD"

            }

        )

    );

}





async function threadUpdate(
    oldThread,
    newThread
){


    if(
        oldThread.name ===
        newThread.name
    ) return;



    const audit =
    await getExecutor(

        newThread.guild,

        AuditLogEvent.ThreadUpdate,

        newThread.id

    );



    sendLog(

        newThread.guild,

        DEFAULT_LOGS,

        createEmbed(

            newThread.guild,

            {

                category:
                "SERVER SYSTEM",

                title:
                "✏ Thread Updated",

                description:
                "A thread setting was changed.",


                fields:[

                    {
                        name:
                        "⬅ BEFORE",

                        value:
                        oldThread.name
                    },


                    {
                        name:
                        "➡ AFTER",

                        value:
                        newThread.name
                    },


                    {
                        name:
                        "🛡 UPDATED BY",

                        value:
                        audit.user
                    }

                ],


                color:
                "#5865F2",

                idPrefix:
                "THRD"

            }

        )

    );

}





/*
=================================================
                 SERVER SYSTEM
=================================================
*/


async function guildUpdate(
    oldGuild,
    newGuild
){


    if(
        oldGuild.name ===
        newGuild.name
    ) return;



    const audit =
    await getExecutor(

        newGuild,

        AuditLogEvent.GuildUpdate,

        newGuild.id

    );



    sendLog(

        newGuild,

        DEFAULT_LOGS,

        createEmbed(

            newGuild,

            {

                category:
                "SERVER SYSTEM",

                title:
                "⚙ Server Updated",

                description:
                "Server configuration was modified.",


                fields:[

                    {
                        name:
                        "⬅ BEFORE",

                        value:
                        oldGuild.name
                    },


                    {
                        name:
                        "➡ AFTER",

                        value:
                        newGuild.name
                    },


                    {
                        name:
                        "🛡 UPDATED BY",

                        value:
                        audit.user
                    }

                ],


                color:
                "#5865F2",

                idPrefix:
                "GUILD"

            }

        )

    );

}





/*
=================================================
             VOICE SYSTEM START
=================================================
*/


async function voiceStateUpdate(
    oldState,
    newState
){

    const member =
    newState.member ||
    oldState.member;


    if(!member) return;



    const guild =
    member.guild;



    /*
       Part 4 continues here:
       - Join
       - Leave
       - Disconnect
       - Move
       - Server mute
       - Server unmute
       - Server deafen
       - Server undeafen
    */


}

/*
=================================================
                 VOICE SYSTEM
=================================================
*/


async function voiceStateUpdate(
    oldState,
    newState
){

    const member =
    newState.member ||
    oldState.member;


    if(!member) return;



    const guild =
    member.guild;



    async function getVoiceDisconnect(){

        try{

            const logs =
            await guild.fetchAuditLogs({

                limit:5,

                type:
                AuditLogEvent.MemberDisconnect

            });



            const entry =
            logs.entries.find(

                e =>
                e.target?.id === member.id &&
                Date.now() - e.createdTimestamp < 10000

            );



            if(entry?.executor){

                return `<@${entry.executor.id}>`;

            }


        }catch(error){

            console.log(
                "Voice Disconnect Audit Error:",
                error
            );

        }


        return null;

    }





/*
=================================================
             MEMBER LEFT / DISCONNECT
=================================================
*/


    if(

        oldState.channel &&
        !newState.channel

    ){


        const executor =
        await getVoiceDisconnect();



        // User left normally

        if(!executor){


            sendLog(

                guild,

                VOICE_LOGS,

                createEmbed(

                    guild,

                    {

                        category:
                        "VOICE SYSTEM",


                        title:
                        "🚪 Voice Channel Left",


                        description:
                        "Member disconnected from voice.",


                        fields:[

                            {
                                name:
                                "👤 MEMBER",

                                value:
                                `<@${member.id}>`
                            },


                            {
                                name:
                                "🎙 CHANNEL",

                                value:
                                oldState.channel.name
                            },


                            {
                                name:
                                "📡 SOURCE",

                                value:
                                "User Initiated"
                            }

                        ],


                        color:
                        "#64748B",

                        idPrefix:
                        "VOICE"

                    }

                )

            );


            return;

        }





        // Staff disconnected them


        sendLog(

            guild,

            VOICE_LOGS,

            createEmbed(

                guild,

                {

                    category:
                    "VOICE SYSTEM",


                    title:
                    "🔌 Member Disconnected",


                    description:
                    "A member was removed from voice.",


                    fields:[

                        {
                            name:
                            "👤 MEMBER",

                            value:
                            `<@${member.id}>`
                        },


                        {
                            name:
                            "🎙 CHANNEL",

                            value:
                            oldState.channel.name
                        },


                        {
                            name:
                            "🛡 AUTHORIZED BY",

                            value:
                            executor
                        }


                    ],


                    color:
                    "#EF4444",


                    idPrefix:
                    "VOICE"

                }

            )

        );


        return;

    }





/*
=================================================
                 JOINED VC
=================================================
*/


    if(

        !oldState.channel &&
        newState.channel

    ){


        sendLog(

            guild,

            VOICE_LOGS,

            createEmbed(

                guild,

                {

                    category:
                    "VOICE SYSTEM",


                    title:
                    "🔊 Voice Channel Joined",


                    description:
                    "Member connected to voice.",


                    fields:[

                        {
                            name:
                            "👤 MEMBER",

                            value:
                            `<@${member.id}>`
                        },


                        {
                            name:
                            "🎙 CHANNEL",

                            value:
                            newState.channel.name
                        },


                        {
                            name:
                            "📡 SOURCE",

                            value:
                            "User Connection"
                        }


                    ],


                    color:
                    "#22C55E",


                    idPrefix:
                    "VOICE"

                }

            )

        );


        return;

    }





/*
=================================================
                MOVED VC
=================================================
*/


    if(

        oldState.channel &&
        newState.channel &&
        oldState.channel.id !== newState.channel.id

    ){


        sendLog(

            guild,

            VOICE_LOGS,

            createEmbed(

                guild,

                {

                    category:
                    "VOICE SYSTEM",


                    title:
                    "🔄 Voice Channel Moved",


                    description:
                    "Member changed voice channels.",


                    fields:[

                        {
                            name:
                            "👤 MEMBER",

                            value:
                            `<@${member.id}>`
                        },


                        {
                            name:
                            "⬅ FROM",

                            value:
                            oldState.channel.name
                        },


                        {
                            name:
                            "➡ TO",

                            value:
                            newState.channel.name
                        }


                    ],


                    color:
                    "#5865F2",


                    idPrefix:
                    "VOICE"

                }

            )

        );


        return;

    }





/*
=================================================
              SERVER MUTE
=================================================
*/


    if(

        oldState.channel &&
        newState.channel &&
        oldState.serverMute !== newState.serverMute

    ){



        const audit =
        await getExecutor(

            guild,

            AuditLogEvent.MemberUpdate,

            member.id

        );



        sendLog(

            guild,

            VOICE_LOGS,

            createEmbed(

                guild,

                {

                    category:
                    "VOICE SYSTEM",


                    title:
                    newState.serverMute
                    ?
                    "🔇 Member Server Muted"
                    :
                    "🔊 Member Server Unmuted",


                    description:
                    "Voice moderation state changed.",


                    fields:[

                        {
                            name:
                            "👤 MEMBER",

                            value:
                            `<@${member.id}>`
                        },


                        {
                            name:
                            "🎙 CHANNEL",

                            value:
                            newState.channel.name
                        },


                        {
                            name:
                            "🛡 AUTHORIZED BY",

                            value:
                            audit.user
                        }


                    ],


                    color:
                    "#64748B",


                    idPrefix:
                    "VOICE"

                }

            )

        );


        return;

    }





/*
=================================================
              SERVER DEAFEN
=================================================
*/


    if(

        oldState.channel &&
        newState.channel &&
        oldState.serverDeaf !== newState.serverDeaf

    ){


        const audit =
        await getExecutor(

            guild,

            AuditLogEvent.MemberUpdate,

            member.id

        );



        sendLog(

            guild,

            VOICE_LOGS,

            createEmbed(

                guild,

                {

                    category:
                    "VOICE SYSTEM",


                    title:
                    newState.serverDeaf
                    ?
                    "🔇 Member Server Deafened"
                    :
                    "🔊 Member Server Undeafened",


                    description:
                    "Voice deafening state changed.",


                    fields:[

                        {
                            name:
                            "👤 MEMBER",

                            value:
                            `<@${member.id}>`
                        },


                        {
                            name:
                            "🎙 CHANNEL",

                            value:
                            newState.channel.name
                        },


                        {
                            name:
                            "🛡 AUTHORIZED BY",

                            value:
                            audit.user
                        }

                    ],


                    color:
                    "#8B5CF6",


                    idPrefix:
                    "VOICE"

                }

            )

        );


        return;

    }


}





/*
=================================================
                  EXPORTS
=================================================
*/


module.exports = [

{
    name:"messageDelete",
    execute:messageDelete
},

{
    name:"messageUpdate",
    execute:messageUpdate
},

{
    name:"guildMemberUpdate",
    execute:guildMemberUpdate
},

{
    name:"roleCreate",
    execute:roleCreate
},

{
    name:"roleDelete",
    execute:roleDelete
},

{
    name:"roleUpdate",
    execute:roleUpdate
},

{
    name:"channelCreate",
    execute:channelCreate
},

{
    name:"channelDelete",
    execute:channelDelete
},

{
    name:"channelUpdate",
    execute:channelUpdate
},

{
    name:"guildBanAdd",
    execute:guildBanAdd
},

{
    name:"guildBanRemove",
    execute:guildBanRemove
},

{
    name:"inviteCreate",
    execute:inviteCreate
},

{
    name:"inviteDelete",
    execute:inviteDelete
},

{
    name:"threadCreate",
    execute:threadCreate
},

{
    name:"threadDelete",
    execute:threadDelete
},

{
    name:"threadUpdate",
    execute:threadUpdate
},

{
    name:"guildUpdate",
    execute:guildUpdate
},

{
    name:"voiceStateUpdate",
    execute:voiceStateUpdate
}

];
