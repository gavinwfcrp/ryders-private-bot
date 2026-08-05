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
            PREMIUM LOG EMBED BUILDER
=================================================
*/


function buildEmbed(
    guild,
    {
        title,
        subtitle,
        user,
        fields = []
    }
){


    const embed =
    new EmbedBuilder()

    .setColor("#202225")

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
${subtitle || "Automated server activity log"}

`

    )


    .addFields(

        fields.map(field => ({

            name:
            field.name,

            value:
            field.value || "N/A",

            inline:
            field.inline ?? true

        }))

    )


    .setFooter({

        text:
        `${guild.name} • Logs`,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    })


    .setTimestamp();



    if(user){

        embed.setThumbnail(

            user.displayAvatarURL({

                dynamic:true,

                size:256

            })

        );

    }



    return embed;

}





/*
=================================================
              AUDIT LOG HELPER
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


    }catch(error){

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

                subtitle:
                "A message was deleted from the server.",

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
                        message.content?.slice(0,1000)
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


    if(oldMessage.content === newMessage.content)
    return;



    sendLog(

        oldMessage.guild,

        DEFAULT_LOGS,

        buildEmbed(

            oldMessage.guild,

            {

                title:
                "✏ Message Edited",

                subtitle:
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
                        oldMessage.content?.slice(0,500)
                        ||
                        "Empty"

                    },


                    {

                        name:
                        "After",

                        value:
                        newMessage.content?.slice(0,500)
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
              MEMBER LOGS
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

            buildEmbed(

                newMember.guild,

                {

                    title:
                    "⏳ Member Timeout",

                    subtitle:
                    "A moderation timeout was applied.",

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
                            "⏱ Ends",

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

            `Nickname: ${oldMember.nickname || oldMember.user.username} → ${newMember.nickname || newMember.user.username}`

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

                subtitle:
                "Member settings were changed.",

                user:
                newMember.user,


                fields:[

                    {

                        name:
                        "Member",

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

                subtitle:
                "A new role was added.",


                fields:[

                    {
                        name:"Role",
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

                subtitle:
                "A role was removed.",


                fields:[

                    {
                        name:"Role",
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

                subtitle:
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

                subtitle:
                "A new channel was created.",


                fields:[

                    {
                        name:"Channel",
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

                subtitle:
                "A channel was removed.",


                fields:[

                    {
                        name:"Channel",
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

                subtitle:
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





/*
=================================================
             BAN / KICK LOGS
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

        buildEmbed(

            ban.guild,

            {

                title:
                "🔨 Member Banned",

                subtitle:
                "A member was banned.",


                fields:[

                    {
                        name:"Member",
                        value:`<@${ban.user.id}>`
                    },

                    {
                        name:"Reason",
                        value:audit.reason
                    },

                    {
                        name:"Moderator",
                        value:audit.user
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

        buildEmbed(

            ban.guild,

            {

                title:
                "🔓 Member Unbanned",

                subtitle:
                "A member was unbanned.",


                fields:[

                    {
                        name:"Member",
                        value:`<@${ban.user.id}>`
                    },

                    {
                        name:"Moderator",
                        value:audit.user
                    }

                ]

            }

        )

    );

}





async function guildMemberRemove(member){


    if(!member.guild)
    return;


    const logs =
    await member.guild.fetchAuditLogs({

        limit:10,

        type:
        AuditLogEvent.MemberKick

    }).catch(()=>null);



    const entry =
    logs?.entries.find(

        e =>
        e.target?.id === member.id &&
        Date.now() -
        e.createdTimestamp <
        15000

    );


    if(!entry)
    return;



    sendLog(

        member.guild,

        BAN_LOGS,

        buildEmbed(

            member.guild,

            {

                title:
                "👢 Member Kicked",

                subtitle:
                "A member was removed by staff.",


                fields:[

                    {
                        name:"Member",
                        value:`<@${member.id}>`
                    },

                    {
                        name:"Moderator",
                        value:`<@${entry.executor.id}>`
                    },

                    {
                        name:"Reason",
                        value:
                        entry.reason ||
                        "No reason provided"
                    }

                ]

            }

        )

    );

}





/*
=================================================
                INVITES
=================================================
*/


async function inviteCreate(invite){


    sendLog(

        invite.guild,

        INVITE_LOGS,

        buildEmbed(

            invite.guild,

            {

                title:
                "🔗 Invite Created",

                subtitle:
                "A new invite was generated.",


                fields:[

                    {
                        name:"Code",
                        value:`\`${invite.code}\``
                    },

                    {
                        name:"Channel",
                        value:`${invite.channel}`
                    },

                    {
                        name:"Creator",
                        value:`${invite.inviter || "Unknown"}`
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

        buildEmbed(

            invite.guild,

            {

                title:
                "🗑 Invite Deleted",

                subtitle:
                "An invite was removed.",


                fields:[

                    {
                        name:"Code",
                        value:`\`${invite.code}\``
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


async function voiceStateUpdate(oldState,newState){


    const member =
    newState.member ||
    oldState.member;


    if(!member)
    return;



    const guild =
    member.guild;



    async function findVoiceExecutor(){


        try{


            const logs =
            await guild.fetchAuditLogs({

                limit:10,

                type:AuditLogEvent.MemberDisconnect

            });



            const entry =
            logs.entries.find(

                e =>
                e.target?.id === member.id &&
                Date.now() -
                e.createdTimestamp <
                10000

            );


            if(entry?.executor)

                return `<@${entry.executor.id}>`;


        }
        catch(error){}



        return null;

    }





    // LEFT OR DISCONNECTED

    if(
        oldState.channel &&
        !newState.channel
    ){


        const executor =
        await findVoiceExecutor();



        sendLog(

            guild,

            VOICE_LOGS,

            buildEmbed(

                guild,

                {

                    title:
                    executor
                    ?
                    "🔌 Voice Disconnected"
                    :
                    "🚪 Left Voice Channel",


                    subtitle:
                    executor
                    ?
                    "A member was removed from voice."
                    :
                    "A member left voice.",


                    user:
                    member.user,


                    fields:[

                        {
                            name:"Member",
                            value:`<@${member.id}>`
                        },

                        {
                            name:"Channel",
                            value:oldState.channel.name
                        },

                        {
                            name:
                            executor
                            ?
                            "Disconnected By"
                            :
                            "Status",

                            value:
                            executor ||
                            "User Left"

                        }

                    ]

                }

            )

        );


        return;

    }





    // JOIN

    if(
        !oldState.channel &&
        newState.channel
    ){


        sendLog(

            guild,

            VOICE_LOGS,

            buildEmbed(

                guild,

                {

                    title:
                    "🔊 Voice Joined",

                    subtitle:
                    "A member joined voice.",


                    user:
                    member.user,


                    fields:[

                        {
                            name:"Member",
                            value:`<@${member.id}>`
                        },

                        {
                            name:"Channel",
                            value:newState.channel.name
                        }

                    ]

                }

            )

        );


        return;

    }





    // MOVE

    if(
        oldState.channel &&
        newState.channel &&
        oldState.channel.id !== newState.channel.id
    ){


        sendLog(

            guild,

            VOICE_LOGS,

            buildEmbed(

                guild,

                {

                    title:
                    "🔄 Voice Moved",

                    subtitle:
                    "A member changed voice channels.",


                    user:
                    member.user,


                    fields:[

                        {
                            name:"Member",
                            value:`<@${member.id}>`
                        },

                        {
                            name:"From",
                            value:oldState.channel.name
                        },

                        {
                            name:"To",
                            value:newState.channel.name
                        }

                    ]

                }

            )

        );


        return;

    }





    // SERVER MUTE FIX

    if(

        oldState.channel &&
        newState.channel &&
        oldState.serverMute !== newState.serverMute &&
        typeof newState.serverMute === "boolean"

    ){


        sendLog(

            guild,

            VOICE_LOGS,

            buildEmbed(

                guild,

                {

                    title:
                    newState.serverMute
                    ?
                    "🔇 Server Muted"
                    :
                    "🔊 Server Unmuted",


                    subtitle:
                    "Voice permissions changed.",


                    user:
                    member.user,


                    fields:[

                        {
                            name:"Member",
                            value:`<@${member.id}>`
                        },

                        {
                            name:"Channel",
                            value:newState.channel.name
                        }

                    ]

                }

            )

        );

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
        name:"voiceStateUpdate",
        execute:voiceStateUpdate
    }

];
