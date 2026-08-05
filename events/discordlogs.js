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
              EMBED DESIGN ENGINE
=================================================
*/


function createLogEmbed(
    guild,
    {
        title,
        description,
        fields = [],
        user = null
    }
){


    const embed =
    new EmbedBuilder()

    .setColor("#1F1F1F")


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
${description}

━━━━━━━━━━━━━━━━━━━━
`
    );



    if(user){

        embed.setThumbnail(

            user.displayAvatarURL({
                dynamic:true,
                size:256
            })

        );

    }



    for(
        const field of fields
    ){

        embed.addFields({

            name:
            field.name,

            value:
            field.value,

            inline:
            field.inline ?? true

        });

    }



    embed.setFooter({

        text:
        "Private Logs",

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

        createLogEmbed(

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
                        "Member",

                        value:
                        `<@${message.author.id}>`

                    },


                    {

                        name:
                        "Channel",

                        value:
                        `${message.channel}`

                    },


                    {

                        name:
                        "Content",

                        value:
                        message.content
                        ?
                        message.content.slice(0,800)
                        :
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

        createLogEmbed(

            oldMessage.guild,

            {

                title:
                "✏ Message Edited",


                description:
                "A message was updated.",


                user:
                oldMessage.author,


                fields:[


                    {

                        name:
                        "Member",

                        value:
                        `<@${oldMessage.author.id}>`

                    },


                    {

                        name:
                        "Channel",

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
               MEMBER UPDATES
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

            createLogEmbed(

                newMember.guild,

                {

                    title:
                    "⏳ Member Timeout",


                    description:
                    "A moderation timeout was applied.",


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
                            "Duration",

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





    const changes = [];



    if(
        oldMember.nickname !==
        newMember.nickname
    ){

        changes.push(

            `Nickname changed`

        );

    }



    if(!changes.length)
    return;



    sendLog(

        newMember.guild,

        DEFAULT_LOGS,

        createLogEmbed(

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
                        "Member",

                        value:
                        `<@${newMember.id}>`

                    },


                    {

                        name:
                        "Changes",

                        value:
                        changes.join("\n")

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

        createLogEmbed(

            role.guild,

            {

                title:
                "🎭 Role Created",


                description:
                "A new role was added.",


                fields:[


                    {

                        name:
                        "Role",

                        value:
                        role.name

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


                description:
                "A role was removed.",


                fields:[


                    {

                        name:
                        "Role",

                        value:
                        role.name

                    },


                    {

                        name:
                        "Deleted By",

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
              ROLE UPDATE
=================================================
*/


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

        createLogEmbed(

            newRole.guild,

            {

                title:
                "✏ Role Updated",


                description:
                "A role was modified.",


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
                "📁 Channel Created",


                description:
                "A new channel was created.",


                fields:[


                    {

                        name:
                        "Channel",

                        value:
                        `${channel}`

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


                description:
                "A channel was removed.",


                fields:[


                    {

                        name:
                        "Channel",

                        value:
                        channel.name

                    },


                    {

                        name:
                        "Deleted By",

                        value:
                        audit.user

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

        createLogEmbed(

            newChannel.guild,

            {

                title:
                "✏ Channel Updated",


                description:
                "A channel was modified.",


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
              BAN / MODERATION
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


                description:
                "A member was banned.",


                fields:[


                    {

                        name:
                        "Member",

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


                description:
                "A member was unbanned.",


                fields:[


                    {

                        name:
                        "Member",

                        value:
                        `<@${ban.user.id}>`

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





async function guildMemberRemove(member){


    if(!member.guild)
    return;



    const logs =
    await member.guild.fetchAuditLogs({

        limit:5,

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

        createLogEmbed(

            member.guild,

            {

                title:
                "👢 Member Kicked",


                description:
                "A member was removed.",


                fields:[


                    {

                        name:
                        "Member",

                        value:
                        `<@${member.id}>`

                    },


                    {

                        name:
                        "Moderator",

                        value:
                        `<@${entry.executor.id}>`

                    },


                    {

                        name:
                        "Reason",

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

        createLogEmbed(

            invite.guild,

            {

                title:
                "🔗 Invite Created",


                description:
                "A new invite was created.",


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


                description:
                "An invite was removed.",


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



    async function voiceAudit(){


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



            if(entry?.executor)

                return `<@${entry.executor.id}>`;



        }
        catch{}

        return "Unknown";

    }





    // Leave / Disconnect

    if(
        oldState.channel &&
        !newState.channel
    ){


        const moderator =
        await voiceAudit();



        sendLog(

            guild,

            VOICE_LOGS,

            createLogEmbed(

                guild,

                {

                    title:
                    moderator !== "Unknown"
                    ?
                    "🔌 Voice Disconnected"
                    :
                    "🚪 Left Voice Channel",


                    description:
                    moderator !== "Unknown"
                    ?
                    "A member was removed from voice."
                    :
                    "A member left voice.",


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
                            moderator !== "Unknown"
                            ?
                            "Removed By"
                            :
                            "Status",

                            value:
                            moderator !== "Unknown"
                            ?
                            moderator
                            :
                            "User Left"

                        }

                    ]

                }

            )

        );


        return;

    }





    // Join

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


                    description:
                    "A member connected.",


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





    // Move

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
                    "🔄 Voice Channel Changed",


                    description:
                    "A member moved channels.",


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





    // Mute

    if(
        oldState.serverMute !==
        newState.serverMute
    ){


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


                    description:
                    "Voice permissions were changed.",


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
                            newState.channel?.name ||
                            "Unknown"

                        }

                    ]

                }

            )

        );

    }

}
