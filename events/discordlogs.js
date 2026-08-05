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
              PREMIUM EMBED DESIGN
=================================================
*/


function createLogEmbed(
    guild,
    options = {}
){

    const {

        title = "Server Log",

        subtitle = "Automated activity record",

        color = "#B91C1C",

        fields = [],

        footer = "Private Logs"

    } = options;



    const embed =
    new EmbedBuilder()



    .setColor(color)



    .setAuthor({

        name:
        guild.name,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    })



    .setTitle(title)



    .setDescription(

`
${subtitle}

────────────────────────
`

    );



    /*
       Inline fields create the wide layout.
       Discord displays these horizontally.
    */


    fields.forEach(field => {

        embed.addFields({

            name:
            field.name,

            value:
            field.value || "—",

            inline:true

        });

    });



    embed.addFields({

        name:" ",
        value:
`
**Event ID**
\`${Math.random()
.toString(36)
.substring(2,8)
.toUpperCase()}\`

**Status**
Completed
`,
        inline:false

    });



    embed.setFooter({

        text:
        `${footer} • ${guild.name}`,

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
            Date.now() -
            e.createdTimestamp <
            15000

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

        user:
        "Unknown",

        reason:
        "No reason provided"

    };

}





/*
=================================================
                 MESSAGE LOGS
=================================================
*/


async function messageDelete(message){


    if(!message.guild) return;

    if(message.author?.bot)
    return;



    sendLog(

        message.guild,

        DEFAULT_LOGS,

        createLogEmbed(

            message.guild,

            {

                title:
                "🗑 Message Deleted",


                subtitle:
                "A message was removed from the server",


                color:
                "#DC2626",


                fields:[


                    {

                        name:
                        "👤 Member",

                        value:
                        `<@${message.author.id}>`

                    },


                    {

                        name:
                        "📍 Channel",

                        value:
                        `${message.channel}`

                    },


                    {

                        name:
                        "💬 Content",

                        value:
                        message.content
                        ?
                        message.content.slice(0,900)
                        :
                        "No content"

                    }


                ]

            }

        )

    );

}





async function messageUpdate(
    oldMessage,
    newMessage
){


    if(!oldMessage.guild)
    return;


    if(oldMessage.author?.bot)
    return;



    if(
        oldMessage.content ===
        newMessage.content
    )
    return;



    sendLog(

        oldMessage.guild,

        DEFAULT_LOGS,

        createLogEmbed(

            oldMessage.guild,

            {

                title:
                "✏ Message Edited",


                subtitle:
                "A message was modified",


                color:
                "#2563EB",


                fields:[


                    {

                        name:
                        "👤 Member",

                        value:
                        `<@${oldMessage.author.id}>`

                    },


                    {

                        name:
                        "📍 Channel",

                        value:
                        `${oldMessage.channel}`

                    },


                    {

                        name:
                        "Before",

                        value:
                        oldMessage.content
                        ?
                        oldMessage.content.slice(0,500)
                        :
                        "Empty"

                    },


                    {

                        name:
                        "After",

                        value:
                        newMessage.content
                        ?
                        newMessage.content.slice(0,500)
                        :
                        "Empty"

                    }


                ]

            }

        )

    );

}





/*
=================================================
              MEMBER UPDATE LOGS
=================================================
*/


async function guildMemberUpdate(
    oldMember,
    newMember
){


    /*
       Timeout added
    */


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

            createLogEmbed(

                newMember.guild,

                {

                    title:
                    "⏳ Member Timeout",


                    subtitle:
                    "A moderation action was applied",


                    color:
                    "#F59E0B",


                    fields:[


                        {

                            name:
                            "👤 Member",

                            value:
                            `<@${newMember.id}>`

                        },


                        {

                            name:
                            "Expires",

                            value:
                            `<t:${Math.floor(
                            newMember.communicationDisabledUntilTimestamp / 1000
                            )}:R>`

                        },


                        {

                            name:
                            "Moderator",

                            value:
                            audit.user

                        }


                    ]

                }

            )

        );


        return;

    }



}

/*
=================================================
                 ROLE LOGS
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

        createLogEmbed(

            role.guild,

            {

                title:
                "🎭 Role Created",


                subtitle:
                "A new role was added to the server",


                color:
                "#22C55E",


                fields:[


                    {

                        name:
                        "🎭 Role",

                        value:
                        `\`${role.name}\``

                    },


                    {

                        name:
                        "Created By",

                        value:
                        audit.user

                    },


                    {

                        name:
                        "Role ID",

                        value:
                        `\`${role.id}\``

                    }


                ]

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

        createLogEmbed(

            role.guild,

            {

                title:
                "🗑 Role Deleted",


                subtitle:
                "A role was removed from the server",


                color:
                "#DC2626",


                fields:[


                    {

                        name:
                        "🎭 Role",

                        value:
                        `\`${role.name}\``

                    },


                    {

                        name:
                        "Deleted By",

                        value:
                        audit.user

                    },


                    {

                        name:
                        "Role ID",

                        value:
                        `\`${role.id}\``

                    }


                ]

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

        createLogEmbed(

            newRole.guild,

            {

                title:
                "✏ Role Updated",


                subtitle:
                "A role name was changed",


                color:
                "#2563EB",


                fields:[


                    {

                        name:
                        "Before",

                        value:
                        oldRole.name

                    },


                    {

                        name:
                        "After",

                        value:
                        newRole.name

                    },


                    {

                        name:
                        "Updated By",

                        value:
                        audit.user

                    }


                ]

            }

        )

    );

}





/*
=================================================
                CHANNEL LOGS
=================================================
*/


async function channelCreate(channel){


    if(!channel.guild)
    return;



    const audit =
    await getExecutor(

        channel.guild,

        AuditLogEvent.ChannelCreate,

        channel.id

    );



    sendLog(

        channel.guild,

        DEFAULT_LOGS,

        createLogEmbed(

            channel.guild,

            {

                title:
                "📂 Channel Created",


                subtitle:
                "A new channel was created",


                color:
                "#22C55E",


                fields:[


                    {

                        name:
                        "📍 Channel",

                        value:
                        `${channel}`

                    },


                    {

                        name:
                        "Created By",

                        value:
                        audit.user

                    },


                    {

                        name:
                        "Channel ID",

                        value:
                        `\`${channel.id}\``

                    }


                ]

            }

        )

    );

}





async function channelDelete(channel){


    if(!channel.guild)
    return;



    const audit =
    await getExecutor(

        channel.guild,

        AuditLogEvent.ChannelDelete,

        channel.id

    );



    sendLog(

        channel.guild,

        DEFAULT_LOGS,

        createLogEmbed(

            channel.guild,

            {

                title:
                "🗑 Channel Deleted",


                subtitle:
                "A channel was removed",


                color:
                "#DC2626",


                fields:[


                    {

                        name:
                        "📍 Channel",

                        value:
                        `\`${channel.name}\``

                    },


                    {

                        name:
                        "Deleted By",

                        value:
                        audit.user

                    },


                    {

                        name:
                        "Channel ID",

                        value:
                        `\`${channel.id}\``

                    }


                ]

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

        createLogEmbed(

            newChannel.guild,

            {

                title:
                "✏ Channel Updated",


                subtitle:
                "A channel name was changed",


                color:
                "#2563EB",


                fields:[


                    {

                        name:
                        "Before",

                        value:
                        oldChannel.name

                    },


                    {

                        name:
                        "After",

                        value:
                        newChannel.name

                    },


                    {

                        name:
                        "Updated By",

                        value:
                        audit.user

                    }


                ]

            }

        )

    );

}

/*
=================================================
              MODERATION LOGS
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

        createLogEmbed(

            ban.guild,

            {

                title:
                "🔨 Member Banned",


                subtitle:
                "A member was removed from the server",


                color:
                "#DC2626",


                fields:[


                    {

                        name:
                        "👤 Member",

                        value:
                        `<@${ban.user.id}>`

                    },


                    {

                        name:
                        "Reason",

                        value:
                        audit.reason

                    },


                    {

                        name:
                        "Moderator",

                        value:
                        audit.user

                    }


                ]

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

        createLogEmbed(

            ban.guild,

            {

                title:
                "🔓 Member Unbanned",


                subtitle:
                "A member was allowed back into the server",


                color:
                "#22C55E",


                fields:[


                    {

                        name:
                        "👤 Member",

                        value:
                        `<@${ban.user.id}>`

                    },


                    {

                        name:
                        "Moderator",

                        value:
                        audit.user

                    },


                    {

                        name:
                        "Reason",

                        value:
                        audit.reason

                    }


                ]

            }

        )

    );

}





/*
=================================================
              KICK DETECTION
=================================================
*/


async function guildMemberRemove(member){


    if(!member.guild)
    return;



    let audit;



    try{


        const logs =
        await member.guild.fetchAuditLogs({

            limit:5,

            type:
            AuditLogEvent.MemberKick

        });



        const entry =
        logs.entries.find(

            e =>
            e.target?.id === member.id &&
            Date.now() -
            e.createdTimestamp <
            15000

        );



        if(entry){

            audit = entry;

        }


    }catch(error){

        console.log(
            "Kick Audit Error:",
            error
        );

    }




    if(!audit)
    return;




    sendLog(

        member.guild,

        BAN_LOGS,

        createLogEmbed(

            member.guild,

            {

                title:
                "👢 Member Kicked",


                subtitle:
                "A member was removed from the server",


                color:
                "#F59E0B",


                fields:[


                    {

                        name:
                        "👤 Member",

                        value:
                        `<@${member.id}>`

                    },


                    {

                        name:
                        "Moderator",

                        value:
                        audit.executor
                        ?
                        `<@${audit.executor.id}>`
                        :
                        "Unknown"

                    },


                    {

                        name:
                        "Reason",

                        value:
                        audit.reason ||
                        "No reason provided"

                    }


                ]

            }

        )

    );

}





/*
=================================================
                 INVITE LOGS
=================================================
*/


async function inviteCreate(invite){


    sendLog(

        invite.guild,

        INVITE_LOGS,

        createLogEmbed(

            invite.guild,

            {

                title:
                "🔗 Invite Created",


                subtitle:
                "A new invite link was generated",


                color:
                "#22C55E",


                fields:[


                    {

                        name:
                        "Code",

                        value:
                        `\`${invite.code}\``

                    },


                    {

                        name:
                        "Channel",

                        value:
                        `${invite.channel}`

                    },


                    {

                        name:
                        "Creator",

                        value:
                        `${invite.inviter || "Unknown"}`

                    }


                ]

            }

        )

    );

}





async function inviteDelete(invite){


    sendLog(

        invite.guild,

        INVITE_LOGS,

        createLogEmbed(

            invite.guild,

            {

                title:
                "🗑 Invite Deleted",


                subtitle:
                "An invite link was removed",


                color:
                "#DC2626",


                fields:[


                    {

                        name:
                        "Code",

                        value:
                        `\`${invite.code}\``

                    }

                ]

            }

        )

    );

}





/*
=================================================
                 THREAD LOGS
=================================================
*/


async function threadCreate(thread){


    if(!thread.guild)
    return;



    const audit =
    await getExecutor(

        thread.guild,

        AuditLogEvent.ThreadCreate,

        thread.id

    );



    sendLog(

        thread.guild,

        DEFAULT_LOGS,

        createLogEmbed(

            thread.guild,

            {

                title:
                "🧵 Thread Created",


                subtitle:
                "A new discussion thread was opened",


                color:
                "#22C55E",


                fields:[


                    {

                        name:
                        "Thread",

                        value:
                        thread.name

                    },


                    {

                        name:
                        "Created By",

                        value:
                        audit.user

                    }


                ]

            }

        )

    );

}





async function threadDelete(thread){


    if(!thread.guild)
    return;



    sendLog(

        thread.guild,

        DEFAULT_LOGS,

        createLogEmbed(

            thread.guild,

            {

                title:
                "🗑 Thread Deleted",


                subtitle:
                "A discussion thread was removed",


                color:
                "#DC2626",


                fields:[


                    {

                        name:
                        "Thread",

                        value:
                        thread.name

                    }

                ]

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
    )
    return;



    sendLog(

        newThread.guild,

        DEFAULT_LOGS,

        createLogEmbed(

            newThread.guild,

            {

                title:
                "✏ Thread Updated",


                subtitle:
                "A thread name was changed",


                color:
                "#2563EB",


                fields:[


                    {

                        name:
                        "Before",

                        value:
                        oldThread.name

                    },


                    {

                        name:
                        "After",

                        value:
                        newThread.name

                    }


                ]

            }

        )

    );

}





/*
=================================================
                SERVER LOGS
=================================================
*/


async function guildUpdate(
    oldGuild,
    newGuild
){


    if(
        oldGuild.name ===
        newGuild.name
    )
    return;



    const audit =
    await getExecutor(

        newGuild,

        AuditLogEvent.GuildUpdate,

        newGuild.id

    );



    sendLog(

        newGuild,

        DEFAULT_LOGS,

        createLogEmbed(

            newGuild,

            {

                title:
                "⚙ Server Updated",


                subtitle:
                "Server settings were modified",


                color:
                "#2563EB",


                fields:[


                    {

                        name:
                        "Before",

                        value:
                        oldGuild.name

                    },


                    {

                        name:
                        "After",

                        value:
                        newGuild.name

                    },


                    {

                        name:
                        "Updated By",

                        value:
                        audit.user

                    }


                ]

            }

        )

    );

}

/*
=================================================
                VOICE LOGS
=================================================
*/


async function voiceStateUpdate(
    oldState,
    newState
){


    const member =
    newState.member ||
    oldState.member;


    if(!member)
    return;



    const guild =
    member.guild;




    async function findDisconnect(){

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
                Date.now() -
                e.createdTimestamp <
                10000

            );



            if(entry?.executor){

                return `<@${entry.executor.id}>`;

            }



        }catch(error){

            console.log(
                "Voice Audit Error:",
                error
            );

        }



        return null;

    }





/*
=================================================
             VOICE DISCONNECT / LEAVE
=================================================
*/


    if(

        oldState.channel &&
        !newState.channel

    ){


        const executor =
        await findDisconnect();




        // User left normally

        if(!executor){


            sendLog(

                guild,

                VOICE_LOGS,

                createLogEmbed(

                    guild,

                    {

                        title:
                        "🚪 Left Voice Channel",


                        subtitle:
                        "Member left a voice channel",


                        color:
                        "#64748B",


                        fields:[


                            {

                                name:
                                "Member",

                                value:
                                `<@${member.id}>`

                            },


                            {

                                name:
                                "Channel",

                                value:
                                oldState.channel.name

                            },


                            {

                                name:
                                "Type",

                                value:
                                "User Leave"

                            }


                        ]

                    }

                )

            );


            return;

        }




        // Someone removed them


        sendLog(

            guild,

            VOICE_LOGS,

            createLogEmbed(

                guild,

                {

                    title:
                    "🔌 Disconnected From Voice",


                    subtitle:
                    "A member was removed from voice",


                    color:
                    "#DC2626",


                    fields:[


                        {

                            name:
                            "Member",

                            value:
                            `<@${member.id}>`

                        },


                        {

                            name:
                            "Channel",

                            value:
                            oldState.channel.name

                        },


                        {

                            name:
                            "Moderator",

                            value:
                            executor

                        }


                    ]

                }

            )

        );


        return;

    }





/*
=================================================
                  JOIN VOICE
=================================================
*/


    if(

        !oldState.channel &&
        newState.channel

    ){


        sendLog(

            guild,

            VOICE_LOGS,

            createLogEmbed(

                guild,

                {

                    title:
                    "🔊 Joined Voice Channel",


                    subtitle:
                    "Member connected to voice",


                    color:
                    "#22C55E",


                    fields:[


                        {

                            name:
                            "Member",

                            value:
                            `<@${member.id}>`

                        },


                        {

                            name:
                            "Channel",

                            value:
                            newState.channel.name

                        }


                    ]

                }

            )

        );


        return;

    }





/*
=================================================
                 MOVED CHANNEL
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

            createLogEmbed(

                guild,

                {

                    title:
                    "🔄 Voice Channel Moved",


                    subtitle:
                    "Member changed channels",


                    color:
                    "#2563EB",


                    fields:[


                        {

                            name:
                            "Member",

                            value:
                            `<@${member.id}>`

                        },


                        {

                            name:
                            "From",

                            value:
                            oldState.channel.name

                        },


                        {

                            name:
                            "To",

                            value:
                            newState.channel.name

                        }


                    ]

                }

            )

        );


        return;

    }





/*
=================================================
             SERVER MUTE / UNMUTE
=================================================
*/


    if(

        oldState.channel &&
        newState.channel &&

        oldState.serverMute !==
        newState.serverMute

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

            createLogEmbed(

                guild,

                {

                    title:
                    newState.serverMute
                    ?
                    "🔇 Server Muted"
                    :
                    "🔊 Server Unmuted",


                    subtitle:
                    "Voice moderation status changed",


                    color:
                    "#F59E0B",


                    fields:[


                        {

                            name:
                            "Member",

                            value:
                            `<@${member.id}>`

                        },


                        {

                            name:
                            "Channel",

                            value:
                            newState.channel.name

                        },


                        {

                            name:
                            "Moderator",

                            value:
                            audit.user

                        }


                    ]

                }

            )

        );


        return;

    }





/*
=================================================
             SERVER DEAFEN / UNDEAFEN
=================================================
*/


    if(

        oldState.channel &&
        newState.channel &&

        oldState.serverDeaf !==
        newState.serverDeaf

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

            createLogEmbed(

                guild,

                {

                    title:
                    newState.serverDeaf
                    ?
                    "🔇 Server Deafened"
                    :
                    "🔊 Server Undeafened",


                    subtitle:
                    "Voice deafen status changed",


                    color:
                    "#8B5CF6",


                    fields:[


                        {

                            name:
                            "Member",

                            value:
                            `<@${member.id}>`

                        },


                        {

                            name:
                            "Channel",

                            value:
                            newState.channel.name

                        },


                        {

                            name:
                            "Moderator",

                            value:
                            audit.user

                        }


                    ]

                }

            )

        );


    }


}





/*
=================================================
                 EXPORT EVENTS
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
        name:"guildMemberRemove",
        execute:guildMemberRemove
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
