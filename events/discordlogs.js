const {
    EmbedBuilder,
    AuditLogEvent
} = require("discord.js");

const { sendLog } = require("../utils/logs");


const DEFAULT_LOGS = "1200188321951924264";
const BAN_LOGS = "1534608390221856768";
const INVITE_LOGS = "1534608280457056357";
const VOICE_LOGS = "1534624514602963306";



async function getExecutor(guild, type, targetId){

    try {

        const logs = await guild.fetchAuditLogs({
            limit: 10,
            type
        });


        const entry = logs.entries.find(
            e => e.target?.id === targetId
        );


        if(entry){

            return {
                user: entry.executor
                    ? `<@${entry.executor.id}>`
                    : "Unknown",

                reason: entry.reason || "No reason provided"
            };

        }


    } catch(error){

        console.log("Audit log error:", error);

    }


    return {
        user:"Unknown",
        reason:"No reason provided"
    };

}



function buildEmbed(guild,title,description){

    return new EmbedBuilder()

    .setColor("#2b2d31")

    .setAuthor({

        name:title,

        iconURL:guild.iconURL({
            dynamic:true
        })

    })

    .setDescription(description)

    .setFooter({

        text:`${guild.name} • Logs`,

        iconURL:guild.iconURL({
            dynamic:true
        })

    })

    .setTimestamp();

}



/* =========================
   MESSAGE DELETE
========================= */

async function messageDelete(message){

    if(!message.guild) return;
    if(message.author?.bot) return;


    const embed = buildEmbed(
        message.guild,
        "🗑️ Message Deleted",
`
**User**
<@${message.author.id}>

**Channel**
${message.channel}

**Message**
${message.content || "No content"}
`
    );


    sendLog(
        message.guild,
        DEFAULT_LOGS,
        embed
    );

}



/* =========================
   MESSAGE UPDATE
========================= */

async function messageUpdate(oldMessage,newMessage){

    if(!oldMessage.guild) return;
    if(oldMessage.author?.bot) return;
    if(oldMessage.content === newMessage.content) return;


    const embed = buildEmbed(
        oldMessage.guild,
        "✏️ Message Edited",
`
**User**
<@${oldMessage.author.id}>

**Channel**
${oldMessage.channel}

**Before**
${oldMessage.content || "No content"}

**After**
${newMessage.content || "No content"}
`
    );


    sendLog(
        oldMessage.guild,
        DEFAULT_LOGS,
        embed
    );

}



/* =========================
   MEMBER UPDATE / TIMEOUTS
========================= */

async function guildMemberUpdate(oldMember,newMember){

    const changes=[];



    // Timeout Added

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


        const embed = buildEmbed(
            newMember.guild,
            "⏳ Member Timed Out",
`
**User**
<@${newMember.id}>

**Duration Ends**
<t:${Math.floor(
newMember.communicationDisabledUntilTimestamp / 1000
)}:R>

**Reason**
${audit.reason}

**Issued By**
${audit.user}
`
        );


        sendLog(
            newMember.guild,
            BAN_LOGS,
            embed
        );


        return;

    }



    // Timeout Removed

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


        const embed = buildEmbed(
            newMember.guild,
            "✅ Timeout Removed",
`
**User**
<@${newMember.id}>

**Removed By**
${audit.user}

**Reason**
${audit.reason}
`
        );


        sendLog(
            newMember.guild,
            BAN_LOGS,
            embed
        );


        return;

    }



    // Nickname Update

    if(oldMember.nickname !== newMember.nickname){

        changes.push(
`
Nickname:
${oldMember.nickname || oldMember.user.username}
→
${newMember.nickname || newMember.user.username}
`
        );

    }



    // Role Changes

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
`
Roles Added:
${added.map(r=>r.name).join(", ")}
`
        );

    }


    if(removed.size){

        changes.push(
`
Roles Removed:
${removed.map(r=>r.name).join(", ")}
`
        );

    }



    if(!changes.length) return;


    const audit =
    await getExecutor(
        newMember.guild,
        AuditLogEvent.MemberUpdate,
        newMember.id
    );


    const embed = buildEmbed(
        newMember.guild,
        "👤 Member Updated",
`
**User**
<@${newMember.id}>

**Changes**
${changes.join("\n")}

**Updated By**
${audit.user}
`
    );


    sendLog(
        newMember.guild,
        DEFAULT_LOGS,
        embed
    );

}

/* =========================
   ROLE LOGS
========================= */

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
            "🎭 Role Created",
`
**Role**
${role.name}

**Created By**
${audit.user}
`
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
            "🗑️ Role Deleted",
`
**Role**
${role.name}

**Deleted By**
${audit.user}
`
        )
    );

}



async function roleUpdate(oldRole,newRole){

    if(oldRole.name === newRole.name) return;


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
            "✏️ Role Updated",
`
**Before**
${oldRole.name}

**After**
${newRole.name}

**Updated By**
${audit.user}
`
        )
    );

}



/* =========================
   CHANNEL LOGS
========================= */

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
            "📂 Channel Created",
`
**Channel**
${channel}

**Created By**
${audit.user}
`
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
            "🗑️ Channel Deleted",
`
**Channel**
${channel.name}

**Deleted By**
${audit.user}
`
        )
    );

}



async function channelUpdate(oldChannel,newChannel){

    if(oldChannel.name === newChannel.name) return;


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
            "✏️ Channel Updated",
`
**Before**
${oldChannel.name}

**After**
${newChannel.name}

**Updated By**
${audit.user}
`
        )
    );

}



/* =========================
   BAN LOGS
========================= */

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
            "🔨 Member Banned",
`
**User**
<@${ban.user.id}>

**ID**
\`${ban.user.id}\`

**Reason**
${audit.reason}

**Banned By**
${audit.user}
`
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
            "🔓 Member Unbanned",
`
**User**
<@${ban.user.id}>

**ID**
\`${ban.user.id}\`

**Reason**
${audit.reason}

**Unbanned By**
${audit.user}
`
        )
    );

}



/* =========================
   INVITE LOGS
========================= */

async function inviteCreate(invite){

    sendLog(
        invite.guild,
        INVITE_LOGS,
        buildEmbed(
            invite.guild,
            "🔗 Invite Created",
`
**Code**
${invite.code}

**Channel**
${invite.channel}

**Creator**
${invite.inviter || "Unknown"}
`
        )
    );

}



async function inviteDelete(invite){

    sendLog(
        invite.guild,
        INVITE_LOGS,
        buildEmbed(
            invite.guild,
            "🗑️ Invite Deleted",
`
**Code**
${invite.code}
`
        )
    );

}



/* =========================
   THREAD LOGS
========================= */

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
            "🧵 Thread Created",
`
**Thread**
${thread.name}

**Created By**
${audit.user}
`
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
            "🗑️ Thread Deleted",
`
**Thread**
${thread.name}

**Deleted By**
${audit.user}
`
        )
    );

}



async function threadUpdate(oldThread,newThread){

    if(oldThread.name === newThread.name) return;


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
            "✏️ Thread Updated",
`
**Before**
${oldThread.name}

**After**
${newThread.name}

**Updated By**
${audit.user}
`
        )
    );

}



/* =========================
   SERVER UPDATE
========================= */

async function guildUpdate(oldGuild,newGuild){

    if(oldGuild.name === newGuild.name) return;


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
            "⚙️ Server Updated",
`
**Before**
${oldGuild.name}

**After**
${newGuild.name}

**Updated By**
${audit.user}
`
        )
    );

}

/* =========================
   VOICE LOGS
========================= */

async function voiceStateUpdate(oldState,newState){

    const member = newState.member || oldState.member;

    if(!member) return;


    let executor = "Unknown";



    async function findExecutor(types){

        for(const type of types){

            try {

                const logs =
                await member.guild.fetchAuditLogs({

                    limit:10,
                    type:type

                });


                const entry =
                logs.entries.find(
                    e =>
                    e.target?.id === member.id &&
                    Date.now() - e.createdTimestamp < 15000
                );


                if(entry?.executor){

                    return `<@${entry.executor.id}>`;

                }


            } catch(error){

                console.log(
                    "Voice audit error:",
                    error
                );

            }

        }


        return "Unknown";

    }




    // =========================
// DISCONNECTED / LEFT VC
// =========================

if(
    oldState.channel &&
    !newState.channel
){

    await new Promise(
        resolve => setTimeout(resolve,1500)
    );


    executor =
    await findExecutor([
        AuditLogEvent.MemberDisconnect,
        AuditLogEvent.MemberMove,
        AuditLogEvent.MemberUpdate
    ]);


    // User left by themselves
    if(executor === "Unknown"){

        sendLog(
            member.guild,
            VOICE_LOGS,
            buildEmbed(
                member.guild,
                "🚪 Voice Channel Left",
`
**User**
<@${member.id}>

**Channel**
${oldState.channel.name}
`
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
        "🚪 User Disconnected",
`
${executor} disconnected <@${member.id}> from **#${oldState.channel.name}**

**User**
<@${member.id}>

**Channel**
${oldState.channel.name}

**Disconnected By**
${executor}
`
    )
);


    return;

}



    // =========================
    // MOVED CHANNELS
    // =========================

    if(
        oldState.channel &&
        newState.channel &&
        oldState.channel.id !== newState.channel.id
    ){

        executor =
        await findExecutor([
            AuditLogEvent.MemberMove
        ]);



        sendLog(
            member.guild,
            VOICE_LOGS,
            buildEmbed(
                member.guild,
                "🔄 Voice Channel Moved",
`
**User**
<@${member.id}>

**From**
${oldState.channel.name}

**To**
${newState.channel.name}

**Moved By**
${executor}
`
            )
        );


        return;

    }




// =========================
// SERVER MUTE
// =========================

if(
    oldState.channel &&
    newState.channel &&
    oldState.serverMute !== newState.serverMute &&
    typeof newState.serverMute === "boolean"
){

    executor =
    await findExecutor([
        AuditLogEvent.MemberUpdate
    ]);


sendLog(
    member.guild,
    VOICE_LOGS,
    buildEmbed(
        member.guild,
        "🎙️ Server Mute Updated",
`
${executor} ${newState.serverMute ? "muted" : "unmuted"} <@${member.id}> in **#${newState.channel.name}**

**User**
<@${member.id}>

**Channel**
${newState.channel.name}

**Changed By**
${executor}
`
    )
);


    return;

}




    // =========================
// SERVER DEAFEN
// =========================

if(
    oldState.channel &&
    newState.channel &&
    oldState.serverDeaf !== newState.serverDeaf &&
    typeof newState.serverDeaf === "boolean"
){

    executor =
    await findExecutor([
        AuditLogEvent.MemberUpdate
    ]);


sendLog(
    member.guild,
    VOICE_LOGS,
    buildEmbed(
        member.guild,
        "🔇 Server Deafen Updated",
`
${executor} ${newState.serverDeaf ? "deafened" : "undeafened"} <@${member.id}> in **#${newState.channel.name}**

**User**
<@${member.id}>

**Channel**
${newState.channel.name}

**Changed By**
${executor}
`
    )
);


    return;

}



    // =========================
    // JOINED VC
    // =========================

    if(
        !oldState.channel &&
        newState.channel
    ){

        sendLog(
            member.guild,
            VOICE_LOGS,
            buildEmbed(
                member.guild,
                "🔊 Voice Channel Joined",
`
**User**
<@${member.id}>

**Channel**
${newState.channel.name}
`
            )
        );

    }

}



/* =========================
   EXPORT EVENTS
========================= */

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
