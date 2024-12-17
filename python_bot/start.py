from bot import WeChatBot
import logging

def main():
    bot = WeChatBot()

    def on_qr(qr_path):
        logging.info(f"New QR code generated: {qr_path}")

    def on_login():
        logging.info("Bot logged in successfully")


    def on_logout():
        logging.info("Bot logged out")

    # Set callbacks
    bot.set_qr_callback(on_qr)
    bot.set_login_callback(on_login)
    bot.set_logout_callback(on_logout)

    try:
        bot.start()
    except KeyboardInterrupt:
        logging.info("Shutting down...")
        bot.stop()

if __name__ == "__main__":
    main()
