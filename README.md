# CTX
CTX is a framework that assists in creating real-time scalable applications by uses similar concepts to micro-service application but on a software level.
CTX allows developers to encapsulate portions of their application into services. A service is an abstraction layer which runs a background thread and an optional foreground thread which provide a real time session for each instance of the service. CTX is highly optimized and provides high scalability and reliability with socket.io serving as the communication protocol.

CTX can be used to provide a standardized workflow for web applications, hybrid mobile applications and API's.

# Documentation
* [Getting Started](docs/examples/Getting_Started.md)
* [API Docs ***3.0***](docs/examples/Getting_Started.md)
* [CLI Docs ***3.0***](https://www.google.com)

# Demos
* [Time Api](https://www.google.com)
* [Single Page Website](https://www.google.com)
* [Generic App](https://www.google.com)

# Migration Notes
## Migrating from version 2
* Version 3 adopts language that helps promote the idea of encapsulated micro-services.
* **CTX.get** changed to **CTX.start**.
* **Node** class has changed to **Service** class.
* Some functionalities were removed from the core and made into extensions.
	* Routing: **ctx-ext-routing**
	* Templating: **ctx-ext-template**
	* Language: **ctx-ext-i8ln**
* **node.ctx.json** renamed to **service.ctx.json**
* **CTX.serve** middleware removed and replaced with **CTX.listen**
