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
                 RYDER BOT CORE
              PRIVATE AUDIT SYSTEM
=================================================
*/


function generateEventID(prefix = "LOG") {

    return `${prefix}-${Math.floor(
        10000 + Math.random() * 90000
    )}`;

}



async function getExecutor(guild, type, targetId){

    try {

        const logs = await guild.fetchAuditLogs({
            limit: 10,
            type
        });


        const entry = logs.entries.find(
            e =>
                e.target?.id === targetId &&
                Date.now() - e.createdTimestamp < 15000
        );


        if(entry){

            return {
                user: entry.executor
                    ? `<@${entry.executor.id}>`
                    : "Unknown",

                reason:
                    entry.reason ||
                    "No reason provided"
            };

        }


    } catch(error){

        console.log(
            "Audit Log Error:",
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
              EMBED DESIGN SYSTEM
=================================================
*/


function buildEmbed(
    guild,
    title,
    fields = [],
    color = "#475569",
    prefix = "LOG"
){

    const eventID = generateEventID(prefix);


    const embed = new EmbedBuilder()


    .setColor(color)


    .setAuthor({

        name:
        `RYDER SYSTEMS  |  ${title}`,

        iconURL:
        guild.iconURL({
            dynamic:true
        })

    })


    .addFields({

        name:
        "━━━━━━━━━━━━━━━━━━━━",

        value:
        fields
        .map(field =>
`
**${field.name}**

${field.value}
`
        )
        .join("\n"),

        inline:false

    })


    .addFields({

        name:
        "━━━━━━━━━━━━━━━━━━━━",

        value:
`
\`EVENT\`
${eventID}

\`STATUS\`
Completed
`

    })


    .setFooter({

        text:
        `${guild.name} • Private Infrastructure`,

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
              MESSAGE LOGS
=================================================
*/


async function messageDelete(message){

    if(!message.guild) return;
    if(message.author?.bot) return;


    const embed = buildEmbed(

        message.guild,

        "Message Deleted",

        [

            {
                name:"👤 Member",
                value:
                `<@${message.author.id}>`
            },

            {
                name:"📍 Channel",
                value:
                `${message.channel}`
            },

            {
                name:"💬 Content",
                value:
                message.content
                ?
                message.content.slice(0,1000)
                :
                "No content"
            }

        ],

        "#64748B",

        "MSG"

    );


    sendLog(
        message.guild,
        DEFAULT_LOGS,
        embed
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



    const embed = buildEmbed(

        oldMessage.guild,

        "Message Updated",

        [

            {
                name:"👤 Member",
                value:
                `<@${oldMessage.author.id}>`
            },


            {
                name:"📍 Channel",
                value:
                `${oldMessage.channel}`
            },


            {
                name:"⬅ Previous",
                value:
                oldMessage.content
                ?
                oldMessage.content.slice(0,500)
                :
                "Empty"
            },


            {
                name:"➡ New",
                value:
                newMessage.content
                ?
                newMessage.content.slice(0,500)
                :
                "Empty"
            }

        ],

        "#5865F2",

        "MSG"

    );


    sendLog(
        oldMessage.guild,
        DEFAULT_LOGS,
        embed
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

    const changes = [];



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

                "Member Timeout",

                [

                    {
                        name:"👤 Member",
                        value:
                        `<@${newMember.id}>`
                    },


                    {
                        name:"⏳ Expires",
                        value:
                        `<t:${Math.floor(
                        newMember.communicationDisabledUntilTimestamp / 1000
                        )}:R>`
                    },


                    {
                        name:"🛡 Authorized By",
                        value:
                        audit.user
                    },


                    {
                        name:"📝 Reason",
                        value:
                        audit.reason
                    }

                ],

                "#F59E0B",

                "MOD"

            )

        );


        return;

    }



    if(
        oldMember.communicationDisabledUntil &&
        !newMember.communicationDisabledUntil
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

                "Timeout Removed",

                [

                    {
                        name:"👤 Member",
                        value:
                        `<@${newMember.id}>`
                    },


                    {
                        name:"🛡 Removed By",
                        value:
                        audit.user
                    }

                ],

                "#22C55E",

                "MOD"

            )

        );


        return;

    }



    if(
        oldMember.nickname !==
        newMember.nickname
    ){

        changes.push(

            `Nickname:
${oldMember.nickname || oldMember.user.username}
→
${newMember.nickname || newMember.user.username}`

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
            `Roles Added:
${added.map(r=>r.name).join(", ")}`
        );

    }



    if(removed.size){

        changes.push(
            `Roles Removed:
${removed.map(r=>r.name).join(", ")}`
        );

    }



    if(!changes.length) return;



    const audit =
    await getExecutor(
        newMember.guild,
        AuditLogEvent.MemberUpdate,
        newMember.id
    );



    sendLog(

        newMember.guild,

        DEFAULT_LOGS,

        buildEmbed(

            newMember.guild,

            "Member Updated",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${newMember.id}>`
                },


                {
                    name:"📋 Changes",
                    value:
                    changes.join("\n\n")
                },


                {
                    name:"🛡 Authorized By",
                    value:
                    audit.user
                }

            ],

            "#64748B",

            "MEM"

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

            "Role Created",

            [

                {
                    name:"🎭 Role",
                    value:
                    `\`${role.name}\``
                },


                {
                    name:"🛡 Created By",
                    value:
                    audit.user
                }

            ],

            "#8B5CF6",

            "ROLE"

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

            "Role Deleted",

            [

                {
                    name:"🎭 Role",
                    value:
                    `\`${role.name}\``
                },


                {
                    name:"🗑 Deleted By",
                    value:
                    audit.user
                }

            ],

            "#EF4444",

            "ROLE"

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

        buildEmbed(

            newRole.guild,

            "Role Updated",

            [

                {
                    name:"⬅ Previous Name",
                    value:
                    oldRole.name
                },


                {
                    name:"➡ New Name",
                    value:
                    newRole.name
                },


                {
                    name:"🛡 Updated By",
                    value:
                    audit.user
                }

            ],

            "#5865F2",

            "ROLE"

        )

    );

}





/*
=================================================
                CHANNEL LOGS
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

        buildEmbed(

            channel.guild,

            "Channel Created",

            [

                {
                    name:"📂 Channel",
                    value:
                    `${channel}`
                },


                {
                    name:"🛡 Created By",
                    value:
                    audit.user
                }

            ],

            "#22C55E",

            "CHAN"

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

        buildEmbed(

            channel.guild,

            "Channel Deleted",

            [

                {
                    name:"📂 Channel",
                    value:
                    `\`${channel.name}\``
                },


                {
                    name:"🗑 Deleted By",
                    value:
                    audit.user
                }

            ],

            "#EF4444",

            "CHAN"

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

        buildEmbed(

            newChannel.guild,

            "Channel Updated",

            [

                {
                    name:"⬅ Previous",
                    value:
                    oldChannel.name
                },


                {
                    name:"➡ New",
                    value:
                    newChannel.name
                },


                {
                    name:"🛡 Updated By",
                    value:
                    audit.user
                }

            ],

            "#5865F2",

            "CHAN"

        )

    );

}





/*
=================================================
                  BAN LOGS
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

            "Member Banned",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${ban.user.id}>`
                },


                {
                    name:"🆔 User ID",
                    value:
                    `\`${ban.user.id}\``
                },


                {
                    name:"📝 Reason",
                    value:
                    audit.reason
                },


                {
                    name:"🔨 Banned By",
                    value:
                    audit.user
                }

            ],

            "#EF4444",

            "BAN"

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

            "Member Unbanned",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${ban.user.id}>`
                },


                {
                    name:"🆔 User ID",
                    value:
                    `\`${ban.user.id}\``
                },


                {
                    name:"🛡 Removed By",
                    value:
                    audit.user
                }

            ],

            "#22C55E",

            "BAN"

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

        buildEmbed(

            invite.guild,

            "Invite Created",

            [

                {
                    name:"🔗 Code",
                    value:
                    `\`${invite.code}\``
                },


                {
                    name:"📂 Channel",
                    value:
                    `${invite.channel}`
                },


                {
                    name:"👤 Creator",
                    value:
                    `${invite.inviter || "Unknown"}`
                }

            ],

            "#22C55E",

            "INV"

        )

    );

}




async function inviteDelete(invite){

    sendLog(

        invite.guild,

        INVITE_LOGS,

        buildEmbed(

            invite.guild,

            "Invite Deleted",

            [

                {
                    name:"🔗 Code",
                    value:
                    `\`${invite.code}\``
                }

            ],

            "#EF4444",

            "INV"

        )

    );

}

/*
=================================================
                 THREAD LOGS
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

        buildEmbed(

            thread.guild,

            "Thread Created",

            [

                {
                    name:"🧵 Thread",
                    value:
                    `\`${thread.name}\``
                },


                {
                    name:"🛡 Created By",
                    value:
                    audit.user
                }

            ],

            "#22C55E",

            "THRD"

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

        buildEmbed(

            thread.guild,

            "Thread Deleted",

            [

                {
                    name:"🧵 Thread",
                    value:
                    `\`${thread.name}\``
                },


                {
                    name:"🗑 Deleted By",
                    value:
                    audit.user
                }

            ],

            "#EF4444",

            "THRD"

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

        buildEmbed(

            newThread.guild,

            "Thread Updated",

            [

                {
                    name:"⬅ Previous",
                    value:
                    oldThread.name
                },


                {
                    name:"➡ New",
                    value:
                    newThread.name
                },


                {
                    name:"🛡 Updated By",
                    value:
                    audit.user
                }

            ],

            "#5865F2",

            "THRD"

        )

    );

}





/*
=================================================
               SERVER UPDATE
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

        buildEmbed(

            newGuild,

            "Server Updated",

            [

                {
                    name:"⬅ Previous Name",
                    value:
                    oldGuild.name
                },


                {
                    name:"➡ New Name",
                    value:
                    newGuild.name
                },


                {
                    name:"🛡 Updated By",
                    value:
                    audit.user
                }

            ],

            "#5865F2",

            "GUILD"

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


    if(!member) return;



    async function getVoiceExecutor(){

        try{

            const logs =
            await member.guild.fetchAuditLogs({

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
                "Voice Audit Error:",
                error
            );

        }


        return null;

    }




/*
==============================
        LEFT / DISCONNECT
==============================
*/


if(
    oldState.channel &&
    !newState.channel
){

    const executor =
    await getVoiceExecutor();



    // User left themselves
    if(!executor){

        sendLog(

            member.guild,

            VOICE_LOGS,

            buildEmbed(

                member.guild,

                "Voice Channel Left",

                [

                    {
                        name:"👤 Member",
                        value:
                        `<@${member.id}>`
                    },


                    {
                        name:"🎙 Channel",
                        value:
                        oldState.channel.name
                    },


                    {
                        name:"📡 Source",
                        value:
                        "User Initiated"
                    }

                ],

                "#64748B",

                "VC"

            )

        );


        return;

    }



    // Someone disconnected them

    sendLog(

        member.guild,

        VOICE_LOGS,

        buildEmbed(

            member.guild,

            "Member Disconnected",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${member.id}>`
                },


                {
                    name:"🎙 Channel",
                    value:
                    oldState.channel.name
                },


                {
                    name:"🛡 Authorized By",
                    value:
                    executor
                },


                {
                    name:"📡 Source",
                    value:
                    "Moderator Action"
                }

            ],

            "#EF4444",

            "VC"

        )

    );


    return;

}





/*
==============================
       CHANNEL MOVE
==============================
*/


if(

    oldState.channel &&
    newState.channel &&
    oldState.channel.id !== newState.channel.id

){


    sendLog(

        member.guild,

        VOICE_LOGS,

        buildEmbed(

            member.guild,

            "Voice Channel Moved",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${member.id}>`
                },


                {
                    name:"⬅ From",
                    value:
                    oldState.channel.name
                },


                {
                    name:"➡ To",
                    value:
                    newState.channel.name
                }

            ],

            "#5865F2",

            "VC"

        )

    );


    return;

}





/*
==============================
        SERVER MUTE
==============================
*/


if(

    oldState.serverMute !==
    newState.serverMute

){

    const executor =
    await getExecutor(

        member.guild,

        AuditLogEvent.MemberUpdate,

        member.id

    );



    sendLog(

        member.guild,

        VOICE_LOGS,

        buildEmbed(

            member.guild,

            "Voice Mute Updated",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${member.id}>`
                },


                {
                    name:"⚙ Action",
                    value:
                    newState.serverMute
                    ?
                    "Server Muted"
                    :
                    "Server Unmuted"
                },


                {
                    name:"🛡 Authorized By",
                    value:
                    executor.user
                }

            ],

            "#64748B",

            "VC"

        )

    );


    return;

}





/*
==============================
        SERVER DEAFEN
==============================
*/


if(

    oldState.serverDeaf !==
    newState.serverDeaf

){

    const executor =
    await getExecutor(

        member.guild,

        AuditLogEvent.MemberUpdate,

        member.id

    );



    sendLog(

        member.guild,

        VOICE_LOGS,

        buildEmbed(

            member.guild,

            "Voice Deafen Updated",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${member.id}>`
                },


                {
                    name:"⚙ Action",
                    value:
                    newState.serverDeaf
                    ?
                    "Server Deafened"
                    :
                    "Server Undeafened"
                },


                {
                    name:"🛡 Authorized By",
                    value:
                    executor.user
                }

            ],

            "#8B5CF6",

            "VC"

        )

    );


    return;

}





/*
==============================
            JOIN
==============================
*/


if(

    !oldState.channel &&
    newState.channel

){


    sendLog(

        member.guild,

        VOICE_LOGS,

        buildEmbed(

            member.guild,

            "Voice Channel Joined",

            [

                {
                    name:"👤 Member",
                    value:
                    `<@${member.id}>`
                },


                {
                    name:"🎙 Channel",
                    value:
                    newState.channel.name
                }

            ],

            "#22C55E",

            "VC"

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
