const { EmbedBuilder } = require("discord.js");
const { sendLog } = require("../utils/logs");


module.exports = {

    name:"guildMemberAdd",

    async execute(member){


        const embed = new EmbedBuilder()

        .setColor("#2b2d31")

        .setAuthor({
            name:"🛬 Member Joined",
            iconURL:member.guild.iconURL({
                dynamic:true
            })
        })

        .setThumbnail(
            member.user.displayAvatarURL({
                dynamic:true,
                size:1024
            })
        )

        .setDescription(
`
Welcome! **<@${member.id}>**

Thank you for joining **${member.guild.name}**
`
        )


        .addFields(

            {
                name:"👤 New Member",
                value:
                `${member.user.tag}\n\`${member.id}\``,
                inline:true
            },

            {
                name:"📅 Account Created",
                value:
                `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                inline:true
            },

            {
                name:"🚪 Joined Server",
                value:
                `<t:${Math.floor(Date.now()/1000)}:R>`,
                inline:true
            },

            {
                name:"👥 Members",
                value:
                `${member.guild.memberCount}`,
                inline:true
            }

        )


        .setFooter({

            text:
            `${member.guild.name} • Airport`,

            iconURL:
            member.guild.iconURL({
                dynamic:true
            })

        })


        .setTimestamp();



        sendLog(
            member.guild,
            "1174541341028528128",
            embed
        );

    }

};