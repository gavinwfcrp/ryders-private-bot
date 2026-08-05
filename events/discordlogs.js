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
          PREMIUM WIDE EMBED SYSTEM
=================================================
*/


function buildEmbed(
    guild,
    {
        title,
        description,
        user,
        fields = [],
        color = "#18191C"
    }
){


    const embed =
    new EmbedBuilder()


    .setColor(color)



    .setAuthor({

        name:
        title,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    })



    .setDescription(

`
${description || "Server activity recorded."}

‎
`

    )



    if(user){

        embed.setThumbnail(

            user.displayAvatarURL({

                dynamic:true,

                size:512

            })

        );

    }



    /*
        Force horizontal layout.
        Discord uses available width better
        with inline fields.
    */


    embed.addFields(

        fields.map(field => ({

            name:
            field.name,

            value:
            field.value || "—",

            inline:
            field.inline !== false

        }))

    );



    embed.setFooter({

        text:
        `${guild.name}  •  Management Logs`,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    });



    embed.setTimestamp();



    return embed;

}





/*
=================================================
              AUDIT LOGGER
=================================================
*/


async function getExecutor(
    guild,
    type,
    targetId
){

    try{


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


    }

    catch(error){

        console.log(
            "Audit Log Error:",
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
              MESSAGE DELETE
=================================================
*/


async function messageDelete(message){


    if(!message.guild)
    return;


    if(message.author?.bot)
    return;



    sendLog(

        message.guild,

        DEFAULT_LOGS,

        buildEmbed(

            message.guild,

            {

                title:
                "🗑 Message Deleted",


                description:
                "A message was removed from the server.",


                user:
                message.author,


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
                        message.content?.slice(0,900)
                        ||
                        "No content",

                        inline:false

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

        buildEmbed(

            oldMessage.guild,

            {

                title:
                "✏ Message Edited",


                description:
                "A message was modified.",


                user:
                oldMessage.author,


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
                        oldMessage.content?.slice(0,400)
                        ||
                        "Empty"

                    },


                    {

                        name:
                        "After",

                        value:
                        newMessage.content?.slice(0,400)
                        ||
                        "Empty"

                    }

                ]

            }

        )

    );

}

/*
=================================================
              MEMBER UPDATE / TIMEOUT
=================================================
*/


async function guildMemberUpdate(oldMember,newMember){


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

            buildEmbed(

                newMember.guild,

                {

                    title:
                    "⏳ Member Timeout",


                    description:
                    "A moderation action was applied.",


                    user:
                    newMember.user,


                    fields:[


                        {

                            name:
                            "👤 Member",

                            value:
                            `<@${newMember.id}>`

                        },


                        {

                            name:
                            "⏱ Duration",

                            value:
                            `<t:${Math.floor(
                            newMember.communicationDisabledUntilTimestamp / 1000
                            )}:R>`

                        },


                        {

                            name:
                            "🛡 Moderator",

                            value:
                            audit.user

                        }


                    ]

                }

            )

        );


        return;

    }



    const changes=[];



    if(
        oldMember.nickname !==
        newMember.nickname
    ){

        changes.push(

            `Nickname changed`

        );

    }



    const added =
    newMember.roles.cache.filter(
        r => !oldMember.roles.cache.has(r.id)
    );


    const removed =
    oldMember.roles.cache.filter(
        r => !newMember.roles.cache.has(r.id)
    );


    if(added.size){

        changes.push(
            `Roles Added: ${added.map(r=>r.name).join(", ")}`
        );

    }


    if(removed.size){

        changes.push(
            `Roles Removed: ${removed.map(r=>r.name).join(", ")}`
        );

    }



    if(!changes.length)
    return;



    sendLog(

        newMember.guild,

        DEFAULT_LOGS,

        buildEmbed(

            newMember.guild,

            {

                title:
                "👤 Member Updated",


                description:
                "Member information changed.",


                user:
                newMember.user,


                fields:[


                    {

                        name:
                        "👤 Member",

                        value:
                        `<@${newMember.id}>`

                    },


                    {

                        name:
                        "Changes",

                        value:
                        changes.join("\n"),

                        inline:false

                    }


                ]

            }

        )

    );

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

        buildEmbed(

            role.guild,

            {

                title:
                "🎭 Role Created",


                description:
                "A new role was created.",


                fields:[

                    {
                        name:"🎭 Role",
                        value:role.name
                    },

                    {
                        name:"Created By",
                        value:audit.user
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

        buildEmbed(

            role.guild,

            {

                title:
                "🗑 Role Deleted",


                description:
                "A role was removed.",


                fields:[

                    {
                        name:"🎭 Role",
                        value:role.name
                    },

                    {
                        name:"Deleted By",
                        value:audit.user
                    }

                ]

            }

        )

    );

}





async function roleUpdate(oldRole,newRole){


    if(oldRole.name === newRole.name)
    return;



    const audit =
    await getExecutor(
        newRole.guild,
        AuditLogEvent.RoleUpdate,
        newRole.id
    );



    sendLog(

        newRole.guild,

        DEFAULT_LOGS,

        buildEmbed(

            newRole.guild,

            {

                title:
                "✏ Role Updated",


                description:
                "A role was modified.",


                fields:[


                    {
                        name:"Before",
                        value:oldRole.name
                    },


                    {
                        name:"After",
                        value:newRole.name
                    },


                    {
                        name:"Updated By",
                        value:audit.user
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

        buildEmbed(

            channel.guild,

            {

                title:
                "📁 Channel Created",


                description:
                "A new channel was created.",


                fields:[


                    {
                        name:"📍 Channel",
                        value:`${channel}`
                    },


                    {
                        name:"Created By",
                        value:audit.user
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

        buildEmbed(

            channel.guild,

            {

                title:
                "🗑 Channel Deleted",


                description:
                "A channel was removed.",


                fields:[


                    {
                        name:"📍 Channel",
                        value:channel.name
                    },


                    {
                        name:"Deleted By",
                        value:audit.user
                    }


                ]

            }

        )

    );

}





async function channelUpdate(oldChannel,newChannel){


    if(oldChannel.name === newChannel.name)
    return;



    const audit =
    await getExecutor(
        newChannel.guild,
        AuditLogEvent.ChannelUpdate,
        newChannel.id
    );



    sendLog(

        newChannel.guild,

        DEFAULT_LOGS,

        buildEmbed(

            newChannel.guild,

            {

                title:
                "✏ Channel Updated",


                description:
                "A channel was modified.",


                fields:[


                    {
                        name:"Before",
                        value:oldChannel.name
                    },


                    {
                        name:"After",
                        value:newChannel.name
                    },


                    {
                        name:"Updated By",
                        value:audit.user
                    }


                ]

            }

        )

    );

}
