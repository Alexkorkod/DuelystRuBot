var request = require('request'),
    fs = require('fs'),
    parsedContent, 
    card_list = [],
    card_image,
    card_label,
    card_manacost,
    card_attack,
    card_health,
    card_text;

fs.readFile("./bd.json", (err, data) => {
  if (err) throw err;
  card_list = JSON.parse(data);
});

const Discord = require('discord.js');
const bot = new Discord.Client();

card_list.forEach(function(item){
    item.label = item.label.toLowerCase();
});
bot.on('ready', () => {
  console.log('I am ready!');
});

bot.login(process.env.BOT_TOKEN);

bot.on('message', message => {
    var re_hello = new RegExp("^\\$(привет|hello|hi|list|commands|команды|bot|бот).*");
    if (message.content.toLowerCase().match(re_hello) && message.author.bot === false ) {
        message.channel.sendMessage("Привет! Я бот этого канала.\n"+
        "Я умею рассказывать про карту, если написать ее название на английском, поставив перед ним символ $.\n"+
        "Если не помнишь название карты целиком - не беда, я пойму тебя даже по его части!\n"+
        "$random выдает случайную карту.\n"+
        "Команда $decklist выдаст тебе ссылку на свежие колоды.\n"+
        "А еще, если напишешь $deck перед сообщением, я его скопирую в канал \"decks\".");
    } else {
        checkMessageForBotContent(message);
    }
});

bot.on('guildMemberAdd', (guild, member) => {
    var channel = guild.channels.find("name","general");
    channel.sendMessage("Привет и добро пожаловать, " + member.user.toString()+ ".");
});

bot.on('error', (error) => {
  console.log(error);
});

var checkMessageForBotContent = function (message) {
    if (message.content.charAt(0) == "$" && message.author.bot === false) {
        if (!checkMessageForRandom(message)) {
            if (!checkMessageForDeckList(message)) {
                if (!checkMessageForDeck(message)) {
                    if (!checkMessageForCard(message)){
                        message.channel.sendMessage("Извини, но такой команды я не знаю.\n"+
                            "Информацию обо мне можно посмотреть по команде $bot");
                    }
                }
            }
        }
    }
};

var processDesc = function (description) {
    var keywords = ["Rush","Frenzy","Provoke","Forcefield","Flying","Blast","Ranged"],
        split,
        result,
        dirt;
    if (description.indexOf(",") > 0) {
        split = description.split(", ");
    } else {
        split = description.split(" ");
    }
    split.forEach(function(word, index, split){
        if (keywords.indexOf(word) >= 0){
            split[index] = "**" + word + "**";
        } 
    });
    if (description.indexOf(",") > 0) {
        result = split.join(", ");
    } else {
        result = split.join(" ");
    }
    return result;
};

var sendCardInfo = function (out,message) {
    var reply = "**"+out.label+"** : ";
    if (out.attack !== "") {
        if (out.mana_cost !== "") {
            reply = reply + 
                out.mana_cost+" mana\n"+
                out.attack+"/"+
                out.health+"\n"+
                processDesc(out.description);
        } else {
            reply = reply + 
                out.attack+"/"+
                out.health+"\n"+
                processDesc(out.description);
        }
    } else {
        reply = reply +
            out.mana_cost+" mana\n"+
            processDesc(out.description);
    }
    message.channel.sendFile(out.image,null,reply)
        .then(function(mess){
            mess.delete(1000*60*10);
        });
};

var checkMessageForRandom = function (message) {
    var re_random = new RegExp("^\\$random.*");
    if (message.content.toLowerCase().match(re_random)) {
        card = card_list[Object.keys(card_list)[randomInteger(0,Object.keys(card_list).length)]];
        sendCardInfo(card,message);
        return true;
    }
    return false;
};

var checkMessageForDeckList = function (message) {
    var re_deck = new RegExp("^\\$decklist.*");
    if (message.content.toLowerCase().match(re_deck)) {
        message.channel.sendMessage("Актуальные колоды можно посмотреть тут:\n"+
            "http://manaspring.ru/decklist/");
        return true;
    }
    return false;
};

var checkMessageForDeck = function (message) {
    var re_deck = new RegExp("^\\$deck.*");
    if (message.content.toLowerCase().match(re_deck) && message.author.bot === false) {
        var deck_channel = message.guild.channels.find("name","decks");
        if (message.attachments.array().length > 0) {
            deck_channel.sendFile(message.attachments.array()[0].url,'',message.content.replace("$deck",""));
        }
        deck_channel.sendMessage(message.content.replace("$deck",""));
        return true;
    }
    return false;
};

var checkMessageForCardAdv = function (message,split) {
    var phrase = message,
        chosen_cards_list = [];
    split = split.reverse();
    split.some(function(word){
        var re = new RegExp(".*"+phrase+".*");
            counter = 0;
        card_list.forEach(function(item){
            if (item.label.toLowerCase().match(re)) {
                chosen_cards_list[counter] = item;
                counter++;
            }
        });
        phrase = phrase.replace(" "+word,"");
        if (chosen_cards_list.length > 0) {
            return true;
        }
    });
    if (chosen_cards_list.length > 0) {
        return chosen_cards_list;
    }
    return false;
};

var checkMessageForCard = function (message) {
    var chosen_cards_list = [],
        out,
        loweredContent = message.content.toLowerCase(),
        trimmedContent = loweredContent.replace("$",""),
        split = trimmedContent.split(" ");
    chosen_cards_list = checkMessageForCardAdv(trimmedContent,split);
    if (chosen_cards_list !== false) {
        out = checkCardsCollection(chosen_cards_list);
        if (typeof out === "string") {
            message.channel.sendMessage(out);
        } else {
            sendCardInfo(out,message);
        }
        return true;
    }
    return false;
};

var checkCardsCollection = function(collection) {
    var out,
        counter;
    collection = makeCollUnique(collection);
    if (Object.keys(collection).length == 1) {
        out = collection[(Object.keys(collection)[0])];
    } else if (Object.keys(collection).length <= 5) {
            out = "";
            counter = 0;
            for (var item in collection) {
                if (counter == Object.keys(collection).length-1) {
                    out = out + " или $" + collection[item].label;
                } else { 
                    out = out + ", $" + collection[item].label;
                }
                counter++;
            }
            out = out.replace(", ","");
            out = out + "?";
    } else {
        out = "Слишком много карт совпадают с этим запросом.\n"+
            "Пожалуйста поконкретней.";
    }
    return out;
};

var makeCollUnique = function(collection) {
    var uniqueColl = [];
    collection.forEach(function(card) {
        if (!(card.label in uniqueColl)) {
            uniqueColl[card.label] = card;
        }
    });
    return uniqueColl;
};

var randomInteger = function (min, max) {
    var rand = min - 0.5 + Math.random() * (max - min + 1);
    rand = Math.round(rand);
    return rand;
  };
