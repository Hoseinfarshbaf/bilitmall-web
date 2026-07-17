/**
 * مقاوم‌سازی DOM در برابر دستکاری خارجی (مثل Google Translate)
 * که باعث خطای معروف React می‌شود:
 * Failed to execute 'removeChild' on 'Node'
 *
 * راهکار رسمی پیشنهادی تیم React:
 * https://github.com/facebook/react/issues/11538
 */

let installed = false;

export function installDomResilience() {
  if (installed || typeof window === "undefined" || typeof Node === "undefined") {
    return;
  }
  installed = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    newNode: T,
    referenceNode: Node | null
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

if (typeof window !== "undefined") {
  installDomResilience();
}
