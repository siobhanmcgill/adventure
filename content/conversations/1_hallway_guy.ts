import {Convo} from '../../src/ts/types';

export const convo: Convo = {
  "default.player_explained_motivation": {
    "goto": "8b-welcome-back"
  },
  "8b-welcome-back#peacemaker": {
    "text": [
      "Oh hey, how goes the quest to solve all of the problems in the world?"
    ],
    "goto": "8b-re-greeting"
  },
  "8b-re-greeting.met_hallway_guy": {
    "text": [
      "p::Hello again, Will. Can I call you Will?::-.met_hallway_guy",
      "me::Actually I go by Bean.::+.met_hallway_guy_again",
      "p::Then hello again, Bean.",
      "me::What’s up?"
    ],
    "goto": "10-core-convo"
  },
  "10-core-convo": {
    "responses": [
      {
        "text": "So what do you think about my idea?",
        "goto": "11-what-do-you-think"
      },
      {
        "text": "What do you do?",
        "goto": "11-what-do-you-do"
      },
      {
        "text": "What do you need help with?",
        "goto": "11-need-help"
      },
      {
        "condition": "#beans_toilet",
        "text": "Have you messaged the building about your toilet?",
        "goto": "11-did-you-call-maintenance"
      },
      {
        "text": "What are you doing out here in the hallway?",
        "goto": "11-why-in-hallway"
      },
      {
        "text": "Well, I’ll see you around",
        "goto": "11-goodbye"
      }
    ]
  },
  "11-what-do-you-think>11-what-do-you-think": {
    "goto": "10-core-convo",
    "text": [
      "me::Well, now that I’ve had some time to think about it, I think it’s going to make you a billionaire.",
      "p::Wow, really?",
      "me::No, but if I tell you something different maybe you’ll stop asking me the same question.",
      "p::Oh."
    ]
  },
  "11-what-do-you-think": {
    "goto": "10-core-convo",
    "text": [
      "me::Yeah, sure, it’s fine.",
      "p::What, is something wrong with it?",
      "me::I mean, how would you monetize it? What’s your marketing plan? How do you maintain your verbal contracts with your clients? What’s your budget? Are you going to compensate the people in your network? Do you take a cut of what they make, or what?",
      "p::Oh, is that all?",
      "me::Well, your investors are going to need to know this stuff.",
      "p::I don’t have any investors.",
      "me::What? Where’s your startup capital coming from?",
      "p::I don’t have any startup capital.",
      "me::What?? How do you expect to run this business? Let me see your Council Proposal.",
      "p::{nowait}I don’t have any-",
      "me::Yeah, yeah, I get it.",
      "p::So are you a _capitalist_?",
      "me::Yeah, sure. I think capitalism makes some sense.",
      "me::A free market would pretty quickly suss out which ideas are worth keeping around.",
      "p::And mine would get ‘sussed’?",
      "me::I guess it’s lucky for capitalism hasn’t fully taken over."
    ]
  },
  "11-what-do-you-do": {
    "goto": "11b-what-do-you-do-2",
    "text": [
      "me::Well I used to be a computer engineer for Dynagistics.::$fix_elevator:find_programmer",
      "me::That was a year ago.",
      "p::I used to work there, too.",
      "me::Yeah, I think we’ve covered that.",
      "p::So what do you do now?",
      "me::You’re looking at it, sister."
    ]
  },
  "11b-what-do-you-do-2$beans_toilet": {
    "goto": "11c-what-do-you-do-3",
    "text": [
      "p::You stand in an empty hallway complaining about your broken toilet?",
      "me::Well the toilet thing has only been today, thankfully. But yeah, otherwise I just stand around killing time."
    ]
  },
  "11c-what-do-you-do-3": {
    "goto": "10-core-convo",
    "text": [
      "p::Do you want to get back into computers?",
      "me::You assume because I got fired a year ago I stopped working with computers?",
      "p::You haven’t?",
      "me::It depends on who’s asking.",
      "p::Hello. I’m {{pp}} and I’m a fixer.",
      "me::We definitely covered that. I mean, like, are you a reporter?",
      "p::I don’t report to the government.",
      "me::Well, let’s just say I still find computer work from time to time.",
      "p::Oh, I see."
    ]
  },
  "11b-what-do-you-do-2#mean": {
    "goto": "11c-what-do-you-do-3",
    "text": [
      "p::You stand in an empty hallway hitting on passers-by?",
      "me::Come on, I didn’t hit on you.",
      "p::Agree to disagree, Horndog."
    ]
  },
  "11b-what-do-you-do-2": {
    "goto": "11c-what-do-you-do-3",
    "text": [
      "p::You stand in an empty hallway leaning against a wall?",
      "me::And I’m darn good at it."
    ]
  },
  "11-need-help": {
    "goto": "10-core-convo",
    "text": [
      "me:: I don't really need help. I could use some credits, though.",
      "p::Don’t you get your allotment like everybody else?",
      "me::Yeah, but it’s a pittance. I can barely afford food for the week.",
      "p::Oh.",
      "me::I guess you haven’t gotten yours yet since moving here. You’ll see.",
      "p::Do you know how somebody might make some extra credit?",
      "me::Of course I do.",
      "p::How?",
      "me::Let me put it this way: most people here aren't criminals when they first move in here.",
      "p::Oh, I see."
    ]
  },
  "mention": {
    "goto": "10-core-convo",
    "text": [
      "p::Do you know {{mention}}?",
      "me::Is this for your Agency? Sorry, I don’t know them."
    ]
  },
  "mention:maintenance_guy$fix_elevator": {
    "goto": "tell_about_elevator"
  },
  "tell_about_elevator": {
    "goto": "tell_about_elevator_2",
    "text": [
      "p::Did you know the elevator is out?::+.told_bean_about_elevator",
      "me::Oh really? Is that why you keep talking to me instead of going down to the atrium?",
      "p::Well, yeah."
    ]
  },
  "tell_about_elevator_2$fix_elevator:ask_bean": {
    "goto": "ask_bean_for_help",
    "text": [
      "p::I guess it’s some sort of computer problem.",
      "me::I’m a computer engineer.",
      "p::Right, I remember you saying that.",
      "me::I see where this is going. I’m in your little Agency network, huh?",
      "p::The very first!",
      "me::No offense, but you should probably try to get out more if I’m your only friend.",
      "p::{nowait}Well, I’m trying, but,",
      "me::The elevator’s down, I get it.",
      "me::And he’s a maintenance guy, you say?",
      "p::Yep."
    ]
  },
  "ask_bean_for_help$beans_toilet": {
    "text": [
      "me::Do I need to spell it out for you?",
      "p::You want him to fix your toilet.",
      "me::Well yeah, he’s a maintenance guy, my room needs maintenance.",
      "p::Okay, I’ll go ask if that’s something he can do.",
      "me::That would be great, thanks!::+$beans_toilet:talk_to_maintenance_guy"
    ]
  },
  "ask_bean_for_help$beans_toilet:return_to_bean": {
    "goto": "return_to_bean_2",
    "text": [
      "p::I talked to him and though he doesn’t know about computers he does know about plumbing.",
      "me::Oh hey. Will he fix my toilet?",
      "p::If you help with the elevator, yes.",
      "me::Okay, great.",
      "me::Um, right now?",
      "p::Yeah, unless you have some more wall-leaning you have to do.",
      "me::Okay. Um.",
      "me::Can’t you just talk to him and see if you can figure out what the problem is?",
      "me::Then I can tell you how to fix it.",
      "p::Why don’t you want to go there yourself?",
      "me::I don’t know. Is the dude intimidating?",
      "p::Huh?",
      "me::The maintenance guy. Is he, like, big and scary or something? ‘No Nonsense’ kind of guy?",
      "p::I don’t think so. He seems perfectly fine to me.",
      "He stands away from the wall, taking a deep breath as if steeling himself for what is about to happen.",
      "me::Okay. Let me grab my terminal.",
      "Bean steps into his room for a moment, and returns holding a  CyberTerminal, closed up like a briefcase.",
      "me::Lead the way.",
      "Bean follows {{p}} down the hallway to the elevator. He keeps his hands in his pockets, adopting a new affect to convey a sense of  nonchalance since he doesn’t have a wall to lean on anymore. The two of them approach the maintenance guy. {{p}} maintains her chipper friendliness, which he greets with a passive grunt.",
      "maintenance_guy::This your computer guy?",
      "p::Yes."
    ]
  },
  "return_to_bean2#mean": {
    "goto": "return_to_bean3",
    "text": [
      "hallway_guy::I’m not ‘hers,’ but I am a computer guy.",
      "hallway_guy::So there’s something going on with the elevator control system?",
      "maintenance_guy::Yeah, I can’t make heads or tails of it. You can be my guest if you think you can figure it out."
    ]
  },
  "return_to_bean3": {
    "goto": "bean_working_wait",
    "text": [
      "He gestures vaguely at the hole in the wall next to him. The polyvinyl covering is leaning against the wall next to the hole, very Bean-like. Inside the hole is what {{p}} can only really describe as a series of boxes, switches, and wires, some of which have little blinking lights. Some of the lights are red, while others are green. {{p}} has no understanding of which, if any, is good or bad.",
      "The maintenance guy returns to his newspaper. His interest in the whole situation expired a while ago, it seems.",
      "Bean flips some of the switches, which reverberates through the panel with a chunky click. He pulls the cover off one of the boxes, revealing more blinking lights and circuitry. He opens up his terminal and connects it to the box with a coiled beige wire. He mumbles something to himself as he works, typing away at the keyboard.",
      "hallway_guy::Oh yeah, that’s not good.",
      "hallway_guy::Hmm...",
      "This may take a little while.::+.bean_working_on_elevator"
    ]
  },
  "bean_working_wait": {
    "responses": [
      {
        "text": "Twiddle your thumbs.",
        "goto": "bean_working_twiddle"
      },
      {
        "text": "Pace.",
        "goto": "bean_working_pace"
      },
      {
        "text": "Ask to help.",
        "goto": "bean_working_ask"
      },
      {
        "text": "Count wall panels.",
        "goto": "bean_working_count"
      },
      {
        "text": "Whistle a tune.",
        "goto": "bean_working_whistle"
      },
      {
        "text": "Chitchat with the maintenance guy.",
        "goto": "bean_working_chitchat"
      },
      {
        "condition": "@crash_dice",
        "text": "Play Crash",
        "goto": "bean_working_crash"
      }
    ]
  },
  "bean_working_twiddle": {
    "goto": "bean_is_working",
    "text": [
      "{{p}} intertwines her fingers and rotates her thumbs around each other, practicing the ancient art of attention-deficient folks through history."
    ]
  },
  "bean_is_working": {
    "goto": "bean_working_wait",
    "onQueueFinishGoto": "bean_is_working",
    "queue": [
      "Bean rubs his chin, looking at a stream of log messages on his screen.",
      "Bean flips a few of the big chunky switches in the panel, watching lights turn off and back on.",
      "Bean lifts the cover from another box in the panel, checking its contents.",
      "Bean types out another command into his terminal. The lights all over the panel start blinking in a different sequence.",
      "Bean removes the cable connecting his terminal, and then sticks it back in again.::+##bean_is_done"
    ]
  },
  "bean_is_working##bean_is_done": {
    "text": [
      "hallway_guy::Okay.",
      "Bean reaches a hand up to the control panel next to the elevator doors. The three of them all watch with baited breath. Something clicks inside the panel, and then the familiar ‘ping’ sounds, indicating the elevator has been called.",
      "hallway_guy::Gotcha!::-.bean_working_on_elevator",
      "He smiles proudly, typing one last command in his terminal. He pulls the cord from the wall and closes it, standing back up.",
      "hallway_guy::There must have been a system update that glitched or something, because it was stuck in a safe mode. I had to-",
      "maintenance_guy::Is it fixed?",
      "hallway_guy::Um, yes. It should be good to go now.::+.elevator_fixed",
      "maintenance_guy::Great.",
      "p::That’s awesome! Great work, Bean.",
      "He blushes, looking down at the floor, and shrugs. {{p}} turns to the maintenance guy to follow through on the bargain.",
      "p::Yeah, so hey can you fix his toilet now?",
      "The maintenance guy carefully examines the contents of the panel, as if scrutinizing Bean’s work. Even to {{p}}’s untrained eye she can tell he has no idea what he’s looking at. He ‘hmms’ and puts the panel cover back in place.",
      "maintenance_guy::Alright, I guess he pulled through on his end.::+$fix_elevator:complete",
      "Bean twists his face up awkwardly and looks at {{p}}. She gives him an encouraging double thumbs up.",
      "maintenance_guy::So which one’s yours?",
      "hallway_guy::Uh, this way.",
      "They head off to Bean’s room, leaving {{p}} alone with the now fully operational elevator.::+$beans_toilet:complete"
    ]
  },
  "bean_working_pace": {
    "goto": "bean_is_working",
    "text": [
      "{{p}} marches a few steps up and down the hallway, pausing for a moment to kick some detritus that turns out to just be a smudge on the floor."
    ]
  },
  "bean_working_ask": {
    "goto": "bean_is_working",
    "text": [
      "p::Can I help at all?",
      "hallway_guy::Hmm?",
      "{{p}} looks at all the blinking lights, the inscrutable stream of code scrolling past Bean’s terminal screen, and the tangled mess of wires and circuits inside the exposed wall panel.",
      "p::Nevermind."
    ]
  },
  "bean_working_count": {
    "goto": "bean_is_working",
    "text": [
      "{{p}} looks up and down the corridor, at least as far as she can see. She counts two-hundred eighty three different panels in the walls. She wonders if there are tons of blinking lights and switches and circuits behind each one."
    ]
  },
  "bean_working_whistle": {
    "goto": "bean_is_working",
    "text": [
      "{{p}} whistles a vague melody. She isn’t very good at whistling, so it’s more of a soft blow."
    ]
  },
  "bean_working_chitchat": {
    "goto": "bean_is_working",
    "text": [
      "p::Anything interesting in the news?",
      "maintenance_guy::Huh?",
      "He looks up from his newspaper, looking at {{p}} like she just spoke a foreign language.",
      "p::Nevermind."
    ]
  },
  "bean_working_crash": {
    "goto": "bean_is_working",
    "text": [
      "{{p}} holds up her crash dice, showing them to the maintenance guy.",
      "p::I can show you how to play.",
      "maintenance_guy::Eh, sure, why not.",
      "[crash:maintenance_guy]"
    ]
  },
  "return_to_bean2": {
    "goto": "return_to_bean3",
    "text": [
      "hallway_guy::Yeah, that’s me. I know a thing or two about the old beeps and boops.",
      "Both {{p}} and the maintenance guy look at Bean rather blankly.",
      "hallway_guy::I don’t know why I said that. That’s nothing.",
      "{{p}} turns to the maintenance guy.",
      "p::Um, maybe show us where the beeps and boops are?",
      "maintenance_guy::Oh, sure, yeah. I can’t make heads or tails of the thing. It’s here in this wall panel."
    ]
  },
  "tell_about_elevator_2": {
    "goto": "bean_smalltalk"
  },
  "bean_smalltalk": {
    "text": [
      "me::Well, okay.",
      "me::Hows the view from your place?",
      "p::It’s okay."
    ]
  },
  "bean_smalltalk#mean": {
    "text": [
      "me::I want it known you approached me.",
      "p::Sure thing, Casanova."
    ]
  },
  "tell_about_elevator_2$fix_elevator:find_programmer": {
    "goto": "ask_bean_for_help",
    "text": [
      "p::The guy said there’s something going on with the elevator computer.",
      "p::Just in case you were curious.",
      "{{me}} looks at {{p}}, trying not to seem interested.",
      "me::Oh, uh, do you know what exactly the problem is?",
      "p::No, neither the maintenance guy or I know much about computers.",
      "me::Yeah, hm. I wonder if it’s in the controller itself or just a software issue.",
      "p::It sounds like you do know about computers.",
      "me::Well, yeah, I was an engineer at Dynagistics.",
      "p::Oh, why didn’t I know that?",
      "me::You never asked, I guess.",
      "p::Do you think you could take a look at it?",
      "me::What’s in it for me?",
      "p::What do you mean?"
    ]
  },
  "tell_about_elevator.told_bean_about_elevator": {
    "goto": "talk_to_bean_again",
    "text": [
      "p::So about the maintenance guy...",
      "me::Yeah?"
    ]
  },
  "talk_to_bean_again$beans_toilet:talk_to_maintenance_guy": {
    "text": [
      "me::Did you talk to him about my toilet?",
      "p::Not yet.",
      "me::Oh, okay. Well, let me know when you do."
    ]
  },
  "talk_to_bean_again": {
    "goto": "ask_bean_for_help"
  },
  "crash": {
    "text": [
      "p::Do you know how to play Crash?",
      "me::Of course I do. It was big at Dynagistics before I left.",
      "p::Wanna play?",
      "me::Sure."
    ]
  },
  "crash_win": {
    "text": [
      "p::Aw, good game.",
      "me::You too. Better luck next time."
    ]
  },
  "crash_lose": {
    "text": [
      "p::Good game.",
      "me::Eh, you got lucky there. You had some good rolls."
    ]
  },
  "11-did-you-call-maintenance": {
    "goto": "10-core-convo",
    "text": [
      "me::Of course. Thankfully I realized it was broken before I had to, you know...",
      "p::Catch up on some reading?",
      "me::Yeah, right.",
      "me::Something you should know, I guess. The building doesn’t really care about the folks up here. I don’t expect them to do anything about it for a while.",
      "p::What if you have to, you know...",
      "me::Make a deposit?",
      "p::Yeah, right.",
      "{nowait}He shrugs.",
      "me::Find a garbage chute?",
      "p::Well you can use mine if you need to in the meantime.",
      "me::Eh, I don’t want to have to owe you that favor."
    ]
  },
  "11-why-in-hallway@empty_thc_capsules": {
    "goto": "10-core-convo",
    "text": [
      "me::Well, I was going to go smoke a cap in the atrium, but then I remembered I am out of caps. So now I'm just standing here.",
      "p::I'm all out, too. I have to take my emptys to the recycler. Maybe if I get my hands on some fresh ones I'll share them with you.",
      "me::Why would you do that?",
      "p::I feel like I've made my motivations pretty clear."
    ]
  },
  "11-why-in-hallway": {
    "goto": "10-core-convo",
    "text": [
      "me::Well, I was going to go to the atrium and vape, but it turns out I don’t have any capsules with any charge left. So now I'm just standing here.",
      "p::Has anybody told you how exciting your life is?",
      "me::What, do you expect me to be hunched over my computer hacking some corp for top secret intel?",
      "p::Can you do that?",
      "me::No.",
      "p::Then I don’t expect you to.",
      "me::I’m glad we cleared that up."
    ]
  },
  "11-goodbye": {
    "text": [
      "me::Yeah. I’m not going anywhere.",
      "{{me}} leans against the wall. He was already leaning against the wall, but he manages to do it even more actively, as if to emphasize that {{p}} doesn’t have to talk to him anymore."
    ]
  },
  "item": {
    "goto": "10-core-convo",
    "text": [
      "me::Yeah I have pockets with random stuff in them too."
    ]
  },
  "8b-re-greeting": {
    "text": [
      "p::Hello again, Bean.",
      "me::What’s up?"
    ],
    "goto": "10-core-convo"
  },
  "8b-welcome-back#enthusiast": {
    "text": [
      "me::Hey, how’s being free treating you?"
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#helper": {
    "text": [
      "me::Hey, are you back to see if I appreciate you yet?"
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#loyalist": {
    "text": [
      "Well, if it isn’t my new best friend."
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#challenger": {
    "text": [
      "me::Hey, if it isn’t the free-thinker."
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#investigator": {
    "text": [
      "me::Hey, it’s the fixer. What problems have you solved lately?."
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#reformer": {
    "text": [
      "me::Hey, look, it’s a woman on a mission."
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#individualist": {
    "text": [
      "me::Hey, it’s miss unique.",
      "p::Who? Oh. That sounded like a name at first.",
      "me::Oh, heh, It did kind of."
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#achiever": {
    "text": [
      "me::Hey, are you back to show me more good ideas?"
    ],
    "goto": "8b-re-greeting"
  },
  "8b-welcome-back#mean": {
    "text": [
      "me::Hey, come to yell at me some more for just minding my own business?"
    ],
    "goto": "8b-re-greeting"
  },
  "default.met_hallway_guy": {
    "goto": "1-answers",
    "text": [
      "p::Hello again, Will.",
      "p::Can I call you Will?",
      "me::I kind of go by ‘Bean.’::-.met_hallway_guy",
      "p::Oh, okay.",
      "p::Hello again, Bean.::+.met_hallway_guy_again",
      "me::Hi, {{pp}}",
      "me::I think I was asking you if you were down on your luck, a criminal, or both."
    ]
  },
  "1-answers": {
    "responses": [
      {
        "text": "Actually I’m just here temporarily",
        "goto": "2-down-on-luck"
      },
      {
        "text": "Actually I’m starting a business",
        "goto": "2-criminal"
      },
      {
        "condition": "#mean",
        "text": "Cool your jets, Horndog, I'm still not interested.",
        "goto": "2-okay-alt"
      },
      {
        "condition": "!#mean",
        "text": "Slow your roll, Casanova, I'm not interested.",
        "goto": "2-okay"
      },
      {
        "text": "Actually, I guess I haven’t decided yet.",
        "goto": "2-both"
      }
    ]
  },
  "2-down-on-luck>2-down-on-luck>2-down-on-luck": {
    "text": [
      "me::Get your new housing assignment yet?::+#temporary",
      "p::Between starting this conversation and now?",
      "me::Yeah. Just wondering if you’ve manifested your destiny by repeating this little mantra.",
      "p::No, but I do have this business idea that might get me out of here some day.",
      "me::Oh, now you’re getting somewhere. Tell me about your business."
    ],
    "goto": "4-fixer"
  },
  "4-fixer": {
    "text": [
      "p::I told you, I’m a Fixer.",
      "me::Yeah, you did tell me that. All I know is that’s not somebody who fixes toilets.",
      "me::What are you going to fix?",
      "{{p}}’s eyes light up as she begins to explain herself.",
      "p::Okay, so basically a fixer is somebody who helps people solve their problems.",
      "p::Like, say you have a problem.",
      "me::I _do_ have a problem",
      "p::Okay, well, yeah, so you could call me up and be like ‘hey I have this problem,’ and I would find someone who can solve it."
    ],
    "goto": "5-what-is-that"
  },
  "5-what-is-that##operations": {
    "text": [
      "me::You don’t solve problems yourself?",
      "p::Well, no, that’s not usually how it works. I’m not really, like, a specialist.",
      "me::Right, you did say you were in Operations.",
      "p::The point is that I’ll build this network of people who all have things they can do, and things they need. I’ll make all the connections so everyone can help and be helped."
    ],
    "goto": "6-why"
  },
  "6-why": {
    "text": [
      "me::You’re like an agent.",
      "p::Yeah, I guess so. It will be an Agency for Helpful People.",
      "me:What made you want to form the {{pp}} Agency for Helpful People, anyway?"
    ],
    "goto": "6b-whyquestions"
  },
  "6b-whyquestions": {
    "responses": [
      {
        "text": "Because it’s my duty to help make the world better.",
        "goto": "7-1"
      },
      {
        "text": "I want people to appreciate me.",
        "goto": "7-2"
      },
      {
        "text": "I want to show the world that I have good ideas.",
        "goto": "7-3"
      },
      {
        "text": "I love finding problems and coming up with solutions.",
        "goto": "7-5"
      },
      {
        "text": "People are the only thing that really matters. I want to protect them, and they’ll protect me.",
        "goto": "7-6"
      },
      {
        "text": "Helping people feels good, and I don’t see anybody else doing this.",
        "goto": "7-4"
      },
      {
        "text": "I can’t rest knowing that people out there need help.",
        "goto": "7-9"
      },
      {
        "text": "This kind of freedom sounds like fun.",
        "goto": "7-7"
      },
      {
        "text": "Because I know I can, and I’m sick of working for other people’s ideas.",
        "goto": "7-8"
      }
    ]
  },
  "7-1": {
    "text": [
      "me::Well I can’t argue with that.::+#reformer",
      "me::Well I _can_, but I wouldn’t come across very sympathetic.",
      "me::So you’re on a mission?"
    ],
    "goto": "8-after-explanation"
  },
  "8-after-explanation": {
    "responses": [
      {
        "text": "Actually, that’s not what I meant...",
        "goto": "68:1323"
      },
      {
        "text": "That’s right.",
        "goto": "9-after-motivation"
      }
    ]
  },
  "68:1323": {
    "text": [
      "::-#reformer",
      "::-#helper",
      "::-#achiever",
      "::-#individualist",
      "::-#investigator",
      "::-#loyalist",
      "::-#enthusiast",
      "::-#challenger",
      "::-#peacemaker"
    ],
    "goto": "6b-whyquestions"
  },
  "9-after-motivation": {
    "text": [
      "me::Right on. When the {{pp}} Agency for Helpfulness makes it big I’ll be able to say I knew you when.::+.player_explained_motivation"
    ],
    "goto": "10-core-convo"
  },
  "7-2": {
    "text": [
      "me::Well I’d certainly appreciate you if you fixed my toilet.::+#helper",
      "p::Oh, is your toilet broken? I didn’t know.",
      "me::Is the sarcasm part of how you get people to appreciate you?"
    ],
    "goto": "8-after-explanation"
  },
  "7-3": {
    "text": [
      "me::When will the good ideas start, exactly?::+#achiever",
      "me::Just kidding.",
      "me::That’s admirable, though. I hope you get to achieve it."
    ],
    "goto": "8-after-explanation"
  },
  "7-5": {
    "text": [
      "me::I get that. That’s a big part of why I got into computers.::+$fix_elevator:find_programmer",
      "me::It feels really good to fix something, doesn’t it?::+#investigator"
    ],
    "goto": "8-after-explanation"
  },
  "7-6": {
    "text": [
      "me::You seem like a good friend to have.::+#loyalist",
      "p::I want to prove you right.",
      "me::So it’s a whole community situation?"
    ],
    "goto": "8-after-explanation"
  },
  "7-4": {
    "text": [
      "me::You’re unique.::+#individualist",
      "me::People only seem to want to help when the Government makes them."
    ],
    "goto": "8-after-explanation"
  },
  "7-9": {
    "text": [
      "me::You can’t solve everybody’s problems.::+#peacemaker",
      "p::Maybe not, but I hate knowing people have problems and I’m not doing anything to help.",
      "me::Save the world, one broken toilet at a time?"
    ],
    "goto": "8-after-explanation"
  },
  "7-7": {
    "text": [
      "me::Does it? I think I need somebody to tell me what to do most of the time.::+#enthusiast",
      "me::You really want to be your own boss?"
    ],
    "goto": "8-after-explanation"
  },
  "7-7##freedom": {
    "text": [
      "me::There’s that ‘freedom’ word again.::+#enthusiast",
      "me::It may sound like fun, but then you end up not knowing what to do with it.",
      "me::That’s what you want?"
    ],
    "goto": "8-after-explanation"
  },
  "7-8": {
    "text": [
      "me::Taking on the challenge by yourself, huh? More power to you, sister.::+#challenger"
    ],
    "goto": "8-after-explanation"
  },
  "7-8##operations": {
    "text": [
      "me::You mean you can operate on your own without corporate Direxpectations or your whole operations team?::+#challenger"
    ],
    "goto": "8-after-explanation"
  },
  "5-what-is-that": {
    "text": [
      "me::So can you help me with my toilet?",
      "p::If I meet anybody who has an extra toilet, absolutely."
    ],
    "goto": "6-why"
  },
  "2-down-on-luck> 5-what-is-that": {
    "text": [
      "me::Is that going to be temporary, too?",
      "p::No, way, this is for serious. If I say I’m going to help, that’s a promise.",
      "me::You’re full of mantras, I guess.",
      "p::Better than being full of something else, I guess.",
      "me::Are you sure you aren’t?",
      "p::Absolutely sure, this is the real deal."
    ],
    "goto": "6-why"
  },
  "5-what-is-that#mean": {
    "text": [
      "me::Don’t you have to be friendly to do that?",
      "p::What do you mean by that?",
      "me::I’d say something, but I don’t want you to think I’m some sort of ‘Casanova.’",
      "p::I already apologized for that.",
      "me::Did you?",
      "p::I think so.",
      "me::Anyway..."
    ],
    "goto": "6-why"
  },
  "2-down-on-luck": {
    "text": [
      "me::Yeah, we all say that.::+#temporary",
      "me::I've been saying that for over a year.",
      "Well I'm feeling pretty lucky.",
      "me::Oh yeah?",
      "Yep.",
      "I lost my job in the Dynagistics Sales Operations Division.",
      "me::They fired me, too!",
      "I'm officially through with my divorce.",
      "me::Congratulations?",
      "If I don't have proof of employment soon I may end up homeless.",
      "me::That’s probably something you should figure out.",
      "Oh, and these are my only pants.",
      "me::Wow. Sounds pretty lucky alright.",
      "Well, see, now I'm free to do whatever I want.",
      "me::And what's that?"
    ],
    "goto": "1-answers"
  },
  "2-down-on-luck>2-down-on-luck": {
    "text": [
      "me::That’s your story and you’re sticking to it, huh?::+#temporary",
      "p::If I say it enough maybe it will come true.",
      "me::Want to say it again, then?"
    ],
    "goto": "1-answers"
  },
  "2-both>2-down-on-luck": {
    "text": [
      "me::Yeah, that’s not much of a plan, though, is it?::+#temporary",
      "p::Sure it is.",
      "me::Eh, I think it’s more of an aspiration, don’t you?",
      "p::Yeah, I guess so.",
      "me::You Ops people always have ideas, though.",
      "me::Even without your Direxpectations, surely you have at least the beginnings of an idea of a plan.",
      "p::Yeah, I guess so.",
      "me::So let’s hear it."
    ],
    "goto": "4-fixer"
  },
  "2-both>2-criminal": {
    "text": [
      "me::And what's _that_?::+#entrepreneur",
      "p::What's a business?",
      "He sighs and rolls his eyes.",
      "me::I know I’m just a lowly computer engineer, but I do know what a business is.::+$fix_elevator:find_programmer",
      "me::I mean, what’s _your_ business?"
    ],
    "goto": "4-fixer"
  },
  "2-down-on-luck>": {
    "text": [
      "2-criminal",
      "me::And what's _that_?::+#entrepreneur",
      "p::What's a business?",
      "{nowait}He sighs and pinches the bridge of his nose.",
      "me::I know what a _business_ is, I mean what's _your_ business?"
    ],
    "goto": "4-fixer"
  },
  "2-criminal": {
    "text": [
      "me::Criminal, it is.::+#entrepreneur",
      "p::Oh I'd be a terrible criminal. I'm too nice.",
      "me::Yeah, walking up to a stranger and telling him your full name kind of gave that away.",
      "p::My business is totally legitimate",
      "me::So you have no plans to nuke the Dynagistics headquarters?",
      "p::No.",
      "p::Wait, what? No!",
      "me:: I mean, I've never fantasized about that. What?",
      "p::What?",
      "me::What?",
      "p::You got something against Dynagistics Corporation?",
      "me::You bet I do. They fired me about six months ago.",
      "p::Oh hey, they fired me too, a few weeks ago.",
      "me::Unemployment buddies?",
      "p::I'm self employed now.",
      "me::Oh right, 'totally legitimate.'",
      "That's right.",
      "me::If you can't beat 'em, join 'em, eh?",
      "me::So what is this business of yours?"
    ],
    "goto": "4-fixer"
  },
  "2-okay-alt": {
    "text": [
      "me::Wow.::+#mean",
      "p::Sorry, I couldn't resist.::+.player_was_mean_twice",
      "me::Is this all just a joke to you?"
    ],
    "responses": [
      {
        "text": "yes",
        "goto": "2b-yes-joke"
      },
      {
        "text": "no",
        "goto": "2b-no-joke"
      },
      {
        "text": "The only joke is your face, slick.",
        "goto": "9-joke-is-face"
      }
    ]
  },
  "2b-yes-joke": {
    "text": [
      "p::I’m just kidding around.::-#mean",
      "p::I’m a kidder.",
      "me::Well let’s see how much you like to kid after you’ve been living up here for a few months.",
      "p::We’ll see.",
      "me::Yeah, we’ll see.",
      "p::Oh, we will.",
      "me::We’re going to see alright.",
      "p::Just you wait.",
      "me:Okay, okay. We get it."
    ]
  },
  "2b-no-joke": {
    "text": [
      "p::I’m new to being a single lady out in the world, okay?",
      "p::So I’m still trying to figure out where the line is, I guess.",
      "me::Okay, I guess that’s fair.",
      "p::To be clear, were you hitting on me?”,”me::No. I don’t think I was.",
      "p::Okay. Thank you for clarifying.",
      "me::Thank you for being honest."
    ]
  },
  "9-joke-is-face": {
    "text": [
      "me::Okay, we get it. You’re kind of a jerk.::+#mean",
      "me::I’m going to give you some advice, though.",
      "me::This little Prologue is kind of a tutorial, see. You have to get through this hallway to move on in the game, and you have to learn some stuff about how the game works to do that.",
      "me::In order to do that, you’ll need my help. Okay?",
      "me::So we’re going to start over so you can try this again.",
      "p::Wow, RIP fourth wall.::+.rejected_hallway_guy",
      "me::Yeah, this is your fault.",
      "p::Okay, okay."
    ]
  },
  "2-okay": {
    "text": [
      "me::Weirdly hostile, but okay. I hear you.::+#mean",
      "me::I guess I'll stay out of your way, then.::+.player_was_mean"
    ]
  },
  "2-down-on-luck>2-both": {
    "text": [
      "me::Yeah, that makes sense.::+#undecided",
      "me::Sometimes freedom isn’t all it’s chopped up to be.",
      "p::What do you mean?",
      "me::When we’re free to do whatever you want, it’s harder to know what we actually want.",
      "me::It’s like, you kind of need the lines so you know where to color.",
      "p::I like to color outside the lines.::+##freedom",
      "me::But see, then you still need the lines.",
      "p::Huh.",
      "me::At least, I read that in a self-help book once.",
      "p::Did it help?",
      "me::Well, I’ve ended up in a tiny government issue apartment with a toilet that won’t work, so...",
      "p::You’re in good company, though.",
      "me::Yeah, a couple captains of industry we are.",
      "p::Well I have been sort of noodling on an idea.",
      "me::I’m all ears."
    ],
    "goto": "4-fixer"
  },
  "2-both": {
    "text": [
      "me::So, down on your luck _and_ a criminal, then.::+#undecided",
      "Now hold on a minute.",
      "me::...",
      "p::...",
      "me::{slow}...",
      "me::I'm holding . . .",
      "p::I guess I have no comeback.",
      "me::I mean, I’m not going ot judge you.",
      "me::You gotta be honest with yourself first.",
      "p::I guess I am still used to working for a corp. Without a set of 'Direxpectations' I am just lost.",
      "me::'Direxpectations?' You worked for Dynagistics?",
      "p::Yeah, I was in the Sales Operations Division until a couple weeks ago.::+##operations",
      "{nowait}{{me}} gestures at himself.",
      "me::Computer R&D.::+$fix_elevator:find_programmer",
      "me::Well, at least until I was _affected_ in the last year’s round of layoffs.",
      "p::I’m sorry.",
      "me::So what happened a couple weeks ago?",
      "p::’Affected’",
      "me::Aw, dang. Well I guess we won’t have to worry about work addiction.",
      "p::I’m not looking back, I’m trying to focus on my plan for what’s next.",
      "me::And what’s that?"
    ],
    "goto": "1-answers"
  },
  "default.player_was_mean": {
    "goto": "1-answers",
    "text": [
      "p::Hey, I'm sorry I said that.",
      "me::It's okay",
      "p::It's been a long week.",
      "me::I get it.",
      "p::So anyway, what was your question?",
      "me::Um, I think I was just wondering what your deal was."
    ]
  },
  "default": {
    "goto": "1-answers",
    "text": [
      "{{p}} waves at the guy, giving him a friendly smile. He nods at her, still leaning against the wall nonchalantly.",
      "p::Hi, I'm {{pp}} and I'm a fixer.",
      "me::Oh.",
      "He stands up, making it seem like it took much more effort than it must have done. He scratches the back of his neck awkwardly, and stares at the floor at {{p}}’s feet.",
      "me::Are you here about my toilet?::+$beans_toilet",
      "p::Um.",
      "p::No.",
      "p::Not that kind of fixer...",
      "The hallway guy sighs, leaning back against the wall again.",
      "me::Oh.",
      "me::Oh yeah, you're the girl who just moved in down the hall.",
      "p::That's me.",
      "me::I'm Wilbeany. It's, uh, nice to meet you.::+.met_hallway_guy",
      "me::Welcome to the building",
      "p::Thanks.",
      "When {{p}} doesn’t walk away, Willbeany gulps as he realizes she must be waiting for some sort of conversation.",
      "me::So, uh, most people who move in here are either down on their luck, a criminal, or both.",
      "me::Which are you?"
    ]
  },
  "default.bean_working_on_elevator": {
    "goto": "bean_working_wait"
  },
  "default.player_was_mean_twice": {
    "goto": "1-answers",
    "text": [
      "p::Okay, okay. I’m sorry.",
      "me::Let me buy you dinner to make it up to me.",
      "p::Seriously?",
      "me::I’m kidding. You can dish it out but you can’t take it?",
      "p::Just keep your eyes up here, and we’ll forget all about it.",
      "me::Point taken.",
      "me::Point very taken.",
      "me::So really, what’s your deal?"
    ]
  }
}
