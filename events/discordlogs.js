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
              EMBED DESIGN SYSTEM
=================================================
*/


function createLogEmbed(
    guild,
    {
        title,
        description,
        user,
        fields = [],
        color = "#1B1D21"
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
${description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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



    if(user){

        embed.setThumbnail(

            user.displayAvatarURL({

                dynamic:true,

                size:512

            })

        );

    }



    embed.setFooter({

        text:
        `${guild.name} • Security Logs`,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    })


    .setTimestamp();



    return embed;

}





/*
=================================================
              AUDIT HANDLER
=================================================
*/


async function getAudit(
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

                executor:
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
            "Audit error:",
            error
        );

    }



    return {

        executor:
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
                "A message was deleted.",


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

        createLogEmbed(

            oldMessage.guild,

            {

                title:
                "✏ Message Edited",


                description:
                "A message was edited.",


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
              MEMBER / TIMEOUT LOGS
=================================================
*/


async function guildMemberUpdate(
    oldMember,
    newMember
){



    /*
    ==========================
        TIMEOUT ADDED
    ==========================
    */


    if(

        !oldMember.communicationDisabledUntil &&

        newMember.communicationDisabledUntil

    ){



        const audit =
        await getAudit(

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
                    "A member received a timeout.",


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
                            "⏱ Expires",

                            value:
                            `<t:${Math.floor(
                            newMember.communicationDisabledUntilTimestamp / 1000
                            )}:R>`

                        },


                        {

                            name:
                            "🛡 Moderator",

                            value:
                            audit.executor

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


        return;

    }




    /*
    ==========================
        TIMEOUT REMOVED
    ==========================
    */


    if(

        oldMember.communicationDisabledUntil &&

        !newMember.communicationDisabledUntil

    ){



        const audit =
        await getAudit(

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
                    "✅ Timeout Removed",


                    description:
                    "A member timeout was removed.",


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
                            "Removed By",

                            value:
                            audit.executor

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

            `Nickname updated`

        );

    }




    const added =
    newMember.roles.cache.filter(

        r =>
        !oldMember.roles.cache.has(r.id)

    );



    const removed =
    oldMember.roles.cache.filter(

        r =>
        !newMember.roles.cache.has(r.id)

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
    await getAudit(
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
                "A new role was created.",


                fields:[


                    {
                        name:"🎭 Role",
                        value:role.name
                    },


                    {
                        name:"Created By",
                        value:audit.executor
                    }

                ]

            }

        )

    );

}




async function roleDelete(role){


    const audit =
    await getAudit(
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
                        name:"🎭 Role",
                        value:role.name
                    },


                    {
                        name:"Deleted By",
                        value:audit.executor
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
    await getAudit(
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
                        name:"Before",
                        value:oldRole.name
                    },


                    {
                        name:"After",
                        value:newRole.name
                    },


                    {
                        name:"Updated By",
                        value:audit.executor
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
    await getAudit(

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
                        name:"📍 Channel",
                        value:`${channel}`
                    },


                    {
                        name:"Created By",
                        value:audit.executor
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
    await getAudit(

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
                        name:"📍 Channel",
                        value:channel.name
                    },


                    {
                        name:"Deleted By",
                        value:audit.executor
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
    await getAudit(

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
                        name:"Before",
                        value:oldChannel.name
                    },


                    {
                        name:"After",
                        value:newChannel.name
                    },


                    {
                        name:"Updated By",
                        value:audit.executor
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
    await getAudit(

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
                        name:"👤 Member",
                        value:`<@${ban.user.id}>`
                    },


                    {
                        name:"Reason",
                        value:audit.reason
                    },


                    {
                        name:"Moderator",
                        value:audit.executor
                    }

                ]

            }

        )

    );

}





async function guildBanRemove(ban){


    const audit =
    await getAudit(

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
                        name:"👤 Member",
                        value:`<@${ban.user.id}>`
                    },


                    {
                        name:"Moderator",
                        value:audit.executor
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

        createLogEmbed(

            member.guild,

            {

                title:
                "👢 Member Kicked",

                description:
                "A member was removed.",


                fields:[


                    {
                        name:"👤 Member",
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

        createLogEmbed(

            invite.guild,

            {

                title:
                "🔗 Invite Created",

                description:
                "A new invite was created.",


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

        createLogEmbed(

            invite.guild,

            {

                title:
                "🗑 Invite Deleted",

                description:
                "An invite was deleted.",


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
