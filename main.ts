//% weight=100 color=#0fbc11 icon="\uf1eb"
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

    let LastConnection = 0
    let Pic: Image[] = []
    let MSG: number[] = []
    let ComPry = -1
    let Connected = -1
    let ConnectedTo = -1
    let ConnectingStage = -1
    let Started = false
    let ReqPryVar = -1
    let reconnect = -1

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
            59049,
            51673,
            54968,
            52625,
            12631
        ]
        Pic = [
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # . . .
            `),
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # # . .
            `),
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # # # .
            `),
            images.createImage(`
            . . . . .
            . . . . .
            . . . . .
            . . . . .
            # # # # #
            `)
        ]
    }
    radio.onReceivedMessage(RadioMessage.Sure, function () {
        if (ConnectingStage == 2 && ConnectedTo == radio.receivedPacket(RadioPacketProperty.SerialNumber)) {
            ConnectedTo = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            ConnectingStage = 3
            Connected = 1
            ComPry = 1
            basic.showLeds(`
                . # . . .
                . . . . .
                . . . . .
                . . . . .
                # # # # .
                `)
        }
    })
    radio.onReceivedMessage(RadioMessage.Yup, function () {
        LastConnection = input.runningTime()
        ConnectingStage = 4
        Connected = 1
        if (reconnect == 0) {
            reconnect = 1
        }
    })
    radio.onReceivedMessage(RadioMessage.Done, function () {
        Connected = 1
        ComPry = 0
        Connecting(3, 0, radio.receivedPacket(RadioPacketProperty.SerialNumber), 4)
    })
    radio.onReceivedMessage(RadioMessage.ImHere, function () {
        if (ReqPryVar == 1 || ReqPryVar == -1) {
            Connecting(1, 1, radio.receivedPacket(RadioPacketProperty.SerialNumber), 1)
        }
    })
    radio.onReceivedMessage(RadioMessage.StillThere, function () {
        if (ConnectedTo == radio.receivedPacket(RadioPacketProperty.SerialNumber) && Connected == 1) {
            radio.sendMessage(RadioMessage.Yup)
            ConnectedTo = radio.receivedPacket(RadioPacketProperty.SerialNumber)
            LastConnection = input.runningTime()
            ConnectingStage = 4
            Connected = 1
            ComPry = 0
            if (reconnect == 0) {
                reconnect = 1
            }
        }
    })
    function Connecting(NextCS: number, CP: number, CN: number, Radio: number) {
        if ((NextCS == 1 || ConnectedTo == CN) && (ConnectingStage == NextCS - 1 && Started)) {
            if (NextCS == 1) {
                ComPry = CP
                ConnectedTo = CN
            }
            music.play(music.tonePlayable(131, music.beat(BeatFraction.Eighth)), music.PlaybackMode.InBackground)
            ConnectingStage = NextCS
            Pic[NextCS - 1].showImage(0, 0)
            led.plot(ComPry, 0)
            basic.pause(100)
            radio.sendMessage(MSG[Radio])
            if (NextCS == 3) {
                basic.pause(5000)
            } else {
                basic.pause(1000)
            }
            if (ConnectingStage == NextCS) {
                music.play(music.tonePlayable(494, music.beat(BeatFraction.Double)), music.PlaybackMode.InBackground)
                for (let index = 0; index <= 5; index++) {
                    basic.showNumber(index)
                    basic.pause(200)
                    if (index == 5 && ConnectingStage == NextCS) {
                        ConnectingAttReset()
                    }
                    if (Connected == 0 && ConnectingStage == NextCS) {
                        radio.sendMessage(MSG[Radio])
                        music.play(music.tonePlayable(262, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
                    } else {
                        break;
                    }
                }
            }
        }
    }
    radio.onReceivedMessage(RadioMessage.RUReal, function () {
        Connecting(2, 0, radio.receivedPacket(RadioPacketProperty.SerialNumber), 2)
    })
    radio.onReceivedMessage(RadioMessage.AndU, function () {
        Connecting(2, 1, radio.receivedPacket(RadioPacketProperty.SerialNumber), 3)
    })
    radio.onReceivedMessage(RadioMessage.AnyOneThere, function () {
        if (ReqPryVar == 0 || ReqPryVar == -1) {
            Connecting(1, 0, radio.receivedPacket(RadioPacketProperty.SerialNumber), 0)
        }
    })
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
            if (true) {
                music._playDefaultBackground(music.builtInPlayableMelody(Melodies.Ringtone), music.PlaybackMode.InBackground)
            }
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
                    reconnect = 0
                    control.raiseEvent(DISTRESS_SIGNAL, SYSTEM_ACTIEF_EVENT)
                } else if (reconnect == 1) {
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
    //% blockId="connect" block="connect to other microbit|| Communication priority for this device is $ReqPry" blockExternalInputs=true
    //% ReqPry.defl=-1
    //% ReqPry.min=-1 ReqPry.max=1
    //% ReqPry.fieldEditor="numberdropdown" ReqPry.fieldOptions.decompileLiterals=true
    //% ReqPry.fieldOptions.data='[["first sender", 1], ["first receiver", 0], ["none", -1]]'
    //% group="first steps"
    export function connect(ReqPry?:number) {
        if (!Started) {
            basic.showNumber(1)
            return
        }
        radio.setTransmitPower(1)
        ReqPryVar = (isNaN(ReqPry) ? -1 : ReqPry)
        while (Connected == 0 && ConnectingStage == 0) {
            flashstorage.remove("Disconnected")
            if (ReqPryVar == 1 || ReqPryVar == -1) {
                radio.sendMessage(RadioMessage.AnyOneThere)
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
        radio.setTransmitPower(7)
        basic.pause(1000)
        basic.showLeds(`
            # . . . #
            . . . . .
            . . . . .
            . . . . .
            # . . . #
            `)
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

    //% blockId=onDisconnect block="when microbit has disconnected"
    //% weight=59 blockGap=32
    //% group="connection"
    export function onDisconnect(handler: () => void) {
        control.onEvent(DISCONNECT_EVENT, SYSTEM_ACTIEF_EVENT, handler)
    }

    //% blockId=onConnect block="when microbit has made a connection"
    //% weight=59 blockGap=32
    //% group="connection"
    export function onConnect(handler: () => void) {
        control.onEvent(CONNECT_EVENT, SYSTEM_ACTIEF_EVENT, handler)
    }

    //% blockId=onDistressSignal block="when distress signal is send"
    //% weight=59 blockGap=32
    //% group="connection"
    export function onDistressSignal(handler: () => void) {
        control.onEvent(DISTRESS_SIGNAL, SYSTEM_ACTIEF_EVENT, handler)
    }

    //% blockId=onReconnection block="when microbit has regain connection"
    //% weight=59 blockGap=32
    //% group="connection"
    export function onReconnection(handler: () => void) {
        control.onEvent(RECONNECTION_EVENT, SYSTEM_ACTIEF_EVENT, handler)
    }

}