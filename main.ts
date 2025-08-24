//% weight=100 color=#484d1b icon="\uf086"
namespace SMCP {
    export enum RadioMessage {
        ImHere = 59049,
        RUReal = 51673,
        AndU = 54968,
        Done = 52625,
        Sure = 12631,
        StillThere = 25073,
        Yup = 31339,
        AnyOneThere = 32263,
        message1 = 49434
    }

    const DISCONNECT_EVENT= 1234
    const CONNECT_EVENT = 4321
    const DISTRESS_SIGNAL = 1423
    const RECONNECTION_EVENT = 1243
    const SYSTEM_ACTIEF_EVENT = 1
    const NUMBER_REC = 4231

    export enum EventFlags {
        //% block="microbit has disconnected"
        DISCONNECT_EVENT = 1234,
        //% block="microbit has made a connection"
        CONNECT_EVENT = 4321,
        //% block="distress signal is send"
        DISTRESS_SIGNAL = 1423,
        //% block="microbit has regain connection"
        RECONNECTION_EVENT = 1243
    }

    export enum CommunicationPriorityTypes {
        //% block="send first"
        FirstSender = 1,
        //% block="receive first"
        FirstReceiver = 0,
        //% block="send or receive first"
        None = -1
    }

    export enum comPryNeedVal {
        //% block="only run if microbit has communication priority"
        HasComPry = 1,
        //% block="only run if microbit does not have communication priority"
        NoHasComPry = 0,
        //% block="always run when received"
        Always = -1
    }
    let Reconnect = -1
    let Sn = 0
    let Param1 = 0
    let Param2 = 0
    let Param3 = 0
    let LastConnection = 0
    let Pic: Image[] = []
    let MSG: number[] = []
    let ComPry = -1
    let Connected = -1
    let ConnectedTo = -1
    let ConnectingStage = -1
    let Started = false
    let ReqPryVar = -1
    let RCN = ""
    let ConnectingActive = true



    function ConnectingAttReset() {
        basic.showLeds(`
            # # # # #
            . # . # .
            . # . # .
            . # . # .
            # # # # #
            `)
        music._playDefaultBackground(music.builtInPlayableMelody(Melodies.PowerDown), music.PlaybackMode.UntilDone)
        flashstorage.put("Disconnected", "1")
        control.reset()
    }

    function Lists() {
        MSG = [
            956300111,
            956300202,
            956300213,
            956300304,
            956300315
        ]
    }

    radio.onReceivedMessage(RadioMessage.Yup, function () {
        LastConnection = input.runningTime()
        ConnectingStage = 4
        Connected = 1
        if (Reconnect == 0) {
            Reconnect = 1
        }
    })
    
    radio.onReceivedMessage(RadioMessage.StillThere, function () {
        if (ConnectingStage == 3) {
            Connected = 1
        }
        if (ConnectedTo == radio.receivedPacket(RadioPacketProperty.SerialNumber) && Connected == 1) {
            radio.sendMessage(RadioMessage.Yup)
            LastConnection = input.runningTime()
            ConnectingStage = 4
            Connected = 1
            ComPry = 0
            if (Reconnect == 0) {
                Reconnect = 1
            }
        }
    })

    function WaitFor(ms: number) {
        for (let i = 0; i < (ms / 50); i++) {
            if (!ConnectingActive) {
                return false
            }
            basic.pause(50);
        }
        return true
    }

    export function Connecting(NextCS: number, CP: number, CN: number, Radio: number) {
        if ((NextCS == 1 || ConnectedTo == CN) && (ConnectingStage == NextCS - 1 && Started)) {
            if (NextCS == 1) {
                ComPry = CP
                ConnectedTo = CN
            }
            music.play(music.tonePlayable(131, music.beat(BeatFraction.Whole)), music.PlaybackMode.InBackground)
            ConnectingStage = NextCS
            led.plotBarGraph((NextCS + (ComPry / 3)), 5)
            basic.pause(100)
            radio.sendNumber(MSG[Radio])
            if (NextCS == 3) {
                WaitFor(5000)
            } else {
                WaitFor(1000)
            }
            if (ConnectingStage == NextCS && ConnectingActive) {
                music.play(music.tonePlayable(494, music.beat(BeatFraction.Double)), music.PlaybackMode.InBackground)
                for (let index = 0; index <= (NextCS == 1 ? 1 : 5); index++) {
                    basic.showNumber(index)
                    WaitFor(100)
                    if (index == (NextCS == 1 ? 1 : 5) && ConnectingStage == NextCS && ConnectingActive) {
                        ConnectingAttReset()
                    }
                    if (Connected == 0 && ConnectingStage == NextCS && ConnectingActive) {
                        radio.sendNumber(MSG[Radio])
                        music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
                    } else {
                        return
                    }
                }
            }
        }
    }

    radio.onReceivedNumber(function (receivedNumber) {
        LastConnection = input.runningTime()
        if (convertToText(receivedNumber).length == 9) {
            if (receivedNumber == 956300315) {
                if (ConnectingStage == 2 && ConnectedTo == radio.receivedPacket(RadioPacketProperty.SerialNumber)) {
                    ConnectedTo = radio.receivedPacket(RadioPacketProperty.SerialNumber)
                    ConnectingStage = 3
                    Connected = 1
                    ComPry = 1
                    radio.sendMessage(RadioMessage.StillThere)
                }
            } else {
                ConnectingActive = false
                control.raiseEvent(9432, receivedNumber)
            }
        } else if (ConnectedTo == radio.receivedPacket(RadioPacketProperty.SerialNumber)) {
            control.raiseEvent(NUMBER_REC, receivedNumber)
        }
    })

    control.onEvent(9432, EventBusValue.MICROBIT_EVT_ANY, function () {
        let evtValue = control.eventValue();
        let RCN = convertToText(evtValue);

        if (ReqPryVar == parseInt(RCN.charAt(7)) || ReqPryVar == -1) {
            let Sn = radio.receivedPacket(RadioPacketProperty.SerialNumber);
            let Param1 = parseInt(RCN.charAt(6));
            let Param2 = parseInt(RCN.charAt(7));
            let Param3 = parseInt(RCN.charAt(8));

            if (!isNaN(Param1) && !isNaN(Param2) && !isNaN(Param3)) {
                Connecting(Param1, Param2, Sn, Param3)
            }
        }
    })


    //% blockId="sendInt" block="Send number $int to other microbit"
    //% int.defl=1
    //% int.min=-99999999 int.max=99999999
    //% group="messages"
    export function sendInt(int:number) {
        radio.sendNumber(Math.min(int, 99999999))
    }

    /**
     * The setup for the simple microbit communication protocol
     * If not run, it will display error number 1
     * @param group the radio group id to connect to
     * @param AB if it should display the A+B confirmation
     */
    //% blockId="init" block="initialise smcp|| in radio group $group do not use AB confirmation $AB" icon="\uf080" blockExternalInputs=true
    //% group.defl=1
    //% group.min=1 group.max=255
    //% AB.shadow=toggleOnOff
    //% AB.defl=false
    //% group="first steps"
    export function init(group?:number, AB?:boolean) {
        LastConnection = 0
        Pic = []
        MSG = []
        ComPry = 0
        Connected = 0
        ConnectedTo = 0
        ConnectingStage = 0
        Started = false
        if (flashstorage.getOrDefault("Disconnected", "0") == "0") {
            Started = false
            Lists()
            radio.setTransmitSerialNumber(true)
            radio.setGroup(group || 1)
            ConnectingStage = 0
            ConnectedTo = 0
            Connected = 0
            ComPry = -1
            music._playDefaultBackground(music.builtInPlayableMelody(Melodies.Ringtone), music.PlaybackMode.InBackground)
            images.createBigImage(`
                # # # . # . . . # .
                # . . . # # . # # .
                # # # . # . # . # .
                . . # . # . . . # .
                # # # . # . . . # .
                `).scrollImage(1, 100)
            images.createBigImage(`
                # # # . # # # . . .
                # . . . # . # . . .
                # . . . # # # . # #
                # . . . # . . . . .
                # # # . # . . . . .
                `).scrollImage(1, 100)
            images.createBigImage(`
                # . . . . . . . . .
                . # . . . . . . . .
                # # # . . # . . . #
                . # . . . . . . . .
                # . . . . . . . . .
                `).scrollImage(1, 100)
            while (!(input.buttonIsPressed(Button.AB)) && !AB) {
                basic.showLeds(`
                    . . . . .
                    . . . . .
                    # . . . #
                    . . . . .
                    . . . . .
                    `)
                basic.showLeds(`
                    . . . . .
                    . # . # .
                    . . . . .
                    . # . # .
                    . . . . .
                    `)
            }
            basic.showLeds(`
                . . . . .
                . . . . #
                . . . # .
                # . # . .
                . # . . .
                `)
            Started = true
        } else {
            flashstorage.remove("Disconnected")
            flashstorage.put("Disconnected", "0")
            ConnectingStage = 0
            ConnectedTo = 0
            Connected = 0
            ComPry = 0
            radio.setTransmitSerialNumber(true)
            radio.setGroup(1)
            Lists()
            basic.showLeds(`
                # . . . #
                . # . # .
                . . # . .
                . # . # .
                # . . . #
                `)
            basic.pause(1000)
            if (input.buttonIsPressed(Button.AB)) {
                flashstorage.remove("Disconnected")
                control.reset()
            }
            Started = true
        }
    }
    /**
     * Will send check signal to check if it is still connected
     * When it does not receive anything back for a certain amount of time, it will send the disconnect signal or the distress signal
     * @param disconnect amount of ms without connection for it to send disconnect signal
     * @param distress amount of ms without connection for it to send distress signal
     */
    //% blockId="check" block="check connection|| disconnect after $disconnect ms and send distress after $distress ms of no connection" blockExternalInputs=true
    //% distress.defl=1000
    //% distress.min=1000 beep.max=disconnect
    //% disconnect.defl=5000
    //% disconnect.min=distress disconnect.max=10000
    //% group="connection"
    export function check(disconnect?: number, distress?:number) {
        if (Connected == 1) {
            if (ComPry == 1) {
                radio.sendMessage(RadioMessage.StillThere)
            }
            basic.pause(500)
            if ((ConnectingStage == 4 && Started)) {
                if (LastConnection + (isNaN(disconnect) ? 5000 : disconnect) < input.runningTime()) {
                    Started = false
                    control.raiseEvent(DISCONNECT_EVENT, SYSTEM_ACTIEF_EVENT)
                } else if (LastConnection + (isNaN(distress) ? 1000 : distress) < input.runningTime()) {
                    Reconnect = 0
                    control.raiseEvent(DISTRESS_SIGNAL, SYSTEM_ACTIEF_EVENT)
                } else if (Reconnect == 1) {
                    Reconnect = -1
                    control.raiseEvent(RECONNECTION_EVENT, SYSTEM_ACTIEF_EVENT)
                }
            }
        }
    }
    /**
     * Will connect to other microbit if also it is also in connect mode
     * When initialise is not run, it will display error number 1
     * @param ReqPry if it should be first sender (1), first receiver (0) or none (-1)
     */
    //% blockId="connect" block="connect to other microbit||this device must $ReqPry connect from nearby only $NearbyMode " icon="\uf080" blockExternalInputs=true
    //% ReqPry.defl=-1
    //% ReqPry.min=-1 ReqPry.max=1
    //% NearbyMode.shadow=toggleOnOff
    //% NearbyMode.defl = true
    //% group="first steps"
    export function connect(NearbyMode?:boolean, ReqPry?: CommunicationPriorityTypes) {
        if (!Started) {
            basic.showNumber(1)
            return
        }
        radio.setTransmitPower(NearbyMode ? 0 : 7)
        ReqPryVar = (isNaN(ReqPry) ? -1 : ReqPry)
        while (Connected == 0 && ConnectingStage == 0) {
            flashstorage.remove("Disconnected")
            if (ReqPryVar == 1 || ReqPryVar == -1) {
                radio.sendNumber(956300100)
                if (ReqPryVar == 1) {
                    basic.showLeds(`
                        . . . . #
                        . . # . #
                        # . # . #
                        . . # . #
                        . . . . #
                        `)
                } else {
                    basic.showLeds(`
                    # . . . #
                    # . # . #
                    # . # . #
                    # . # . #
                    # . . . #
                    `)
                }
            } else {
                basic.showLeds(`
                    # . . . .
                    # . # . .
                    # . # . #
                    # . # . .
                    # . . . .
                    `)
            }
            basic.pause(1000)
            LastConnection = input.runningTime()
        }
        while (Connected != 1) {
            basic.pause(1000)
            LastConnection = input.runningTime()
        }
        LastConnection = input.runningTime()
        Pic = []
        MSG = []
        basic.showLeds(`
            # . . . #
            . . . . .
            . . . . .
            . . . . .
            # . . . #
            `)
        basic.pause(1000)
        control.raiseEvent(CONNECT_EVENT, SYSTEM_ACTIEF_EVENT)
        radio.setTransmitPower(7)
        LastConnection = input.runningTime()
    }

    //% blockId=resetVar block="reset variables for new connection"
    //% group="connection"
    export function resetVar() {
        LastConnection = 0
        Pic = []
        MSG = []
        ComPry = 0
        Connected = 0
        ConnectedTo = 0
        ConnectingStage = 0
        Started = true
        Lists()
    }

    //% blockId=getComPry block="has communication priority"
    //% group="connection"
    export function getComPry() {
        if (ComPry == 1) {
            return true
        } else {
            return false
        }
    }

    //% blockId=connected block="connected"
    //% group="connection"
    export function connected() {
        if (Connected == 1) {
            return true
        } else {
            return false
        }
    }

    //% blockId=onEvent block="when $event"
    //% weight=59 blockGap=32
    //% group="connection"
    export function onEvent(event:EventFlags,handler: () => void) {
        control.onEvent(event, SYSTEM_ACTIEF_EVENT, handler)
    }

    //% blockId=received block="when $int is received $ComPryNeed" blockExternalInputs=true
    //% weight=59 blockGap=32
    //% ComPryNeed.defl=SMCP.comPryNeedVal.Always
    //% int.defl=1
    //% group="messages"
    export function received(int: number, ComPryNeed: comPryNeedVal, handler: () => void ) {
        ComPryNeed = (isNaN(ComPryNeed) ? -1 : ComPryNeed)
        if (ComPryNeed == ComPry || ComPryNeed == -1) {
            control.onEvent(NUMBER_REC, int, handler)
        }
    }
}