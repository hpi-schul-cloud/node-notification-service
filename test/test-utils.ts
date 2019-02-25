export default class TestUtils {
		public static timeout(delay: number) {
				return new Promise((resolve) => {
						setTimeout(() => resolve(), delay);
				});
		}
}
