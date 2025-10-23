from paho.mqtt import client as mqtt

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

def on_message(client, userdata, msg):
    print(f"Message received: {msg.topic} {msg.payload}")

def mqtt_setup(broker, port, client_id):
    client = mqtt.Client(client_id)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(broker, port, 60)
    return client

def mqtt_publish(client, topic, message):
    client.publish(topic, message)

def mqtt_subscribe(client, topic):
    client.subscribe(topic)