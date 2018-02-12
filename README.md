# CTX
CTX is an abstraction layer for creating real-time scalable nano-service application.
CTX is highly optimized through caching and provides high scalability and reliability with socket.io serving as the communication protocol.

# Documentation
* [Getting Started](docs/Getting_Started.md)
* [API Docs ***3.0***](docs/API_Docs.md)
* [CLI Docs ***3.0***](docs/CLI_Docs.md)
* [CTX Developer Docs ***3.0***](docs/Developer_Docs.md)

# Demos
* [Time Api](docs/examples/Time_Api.md)
* [Generic App](docs/examples/Generic_App.md)
* [Single Page Website](docs/examples/Sinle_Page_Website.md)

# Migration Notes
## Migrating from version 2
* Version 3 adopts language that helps promote the idea of encapsulated nano-services.
* **CTX.get** changed to **CTX.start**.
* **Node** class has changed to **Service** class.
* Some functionalities were removed from the core and made into extensions.
	* Routing: **ctxjs-routing**
	* Templating: **ctxjs-template**
	* Language: **ctxjs-i8ln**
* **node.ctx.json** renamed to **service.ctx.json**
* **CTX.serve** middleware removed and replaced with **CTX.listen**
