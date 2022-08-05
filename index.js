import say from "say";
import tmi from "tmi.js";
import { identity, channels, redemptionData, trustedUsers, slurFoundMessage, slurs, commandMap } from "./secrets.js"

const FREEFORALL = true;

const options = {
    options: {
        debug: false
    },
    connection: {
        cluster: "aws",
        reconnect: true
    },
    identity: identity,
    channels: channels
};

let client = new tmi.client(options);
client.connect();

const slurCheck = (message) => {
    return (
        message.split(" ").map((word) => {
            return slurs.includes(word) 
        }).includes(true));
};

const trustedUserCheck = (userstate) => {
    return trustedUsers.trustedUsers.includes(userstate.username.toLowerCase());
}

const commandPresence = (message) => {
    return message.toLowerCase().split("!say");
}

const redeemConversion = (rewardType) => {
    return redemptionData[rewardType];
}

const sendMessageWithSlurChecking = (spoken_phrase, ffaValidation, slurCheckResult, channel, userstate) => {
    if (slurCheckResult) {
        say.speak(slurFoundMessage)
    } else {
        if(ffaValidation) {
            if (spoken_phrase.length < 128) {
                say.speak(spoken_phrase);
            } else {
                client.say(channel, `${userstate.username}, your message is too dang long :(`)
            }
        } else {
            client.say(channel, `${userstate.username}, I'm in channel point redemption only mode :(`)
        }
    }
}

const debugLines = (userstate, message, slurCheckResult) => {
    console.log(`${userstate.username} | Slur(${slurCheckResult}) | ${message}`)
}

client.on("connected", (address, port)=> {
    console.log(`Online in mode ffa=${FREEFORALL} mode`)
})

client.on("chat", (channel, userstate, message, self) => {
    if(self) return;

    let say_array = commandPresence(message);
    
    if(say_array.length == 2) {
        let spokenPhrase = say_array[1];
        let slurCheckResult = slurCheck(spokenPhrase);

        debugLines(userstate, message, slurCheckResult);

        sendMessageWithSlurChecking(spokenPhrase, FREEFORALL, slurCheckResult, channel, userstate)
    }
})

client.on("redeem", (channel, username, rewardType, tags, message) => {
    switch(commandMap[redeemConversion(rewardType)]) {
    case 'tts':
        let slurCheckResult = slurCheck(message);
        sendMessageWithSlurChecking(message, true, slurCheckResult);
        break;
    default:
        break;
    }
})