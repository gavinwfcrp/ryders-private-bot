function sendLog(guild, channelID, embed){

    const channel = guild.channels.cache.get(channelID);

    if(!channel) {
        console.log(`Could not find log channel: ${channelID}`);
        return;
    }


    channel.send({
        embeds:[embed]
    });

}


module.exports = {
    sendLog
};