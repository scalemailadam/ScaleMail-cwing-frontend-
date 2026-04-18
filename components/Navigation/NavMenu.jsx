import { Menu, Transition } from "@headlessui/react";
import { Fragment, useRef, useState } from "react";

const MW = {
  content:   "#060604",
  gold:      "#1e1808",
  goldDim:   "#0e0c04",
  cream:     "#d4c880",
  goldText:  "#c8be78",
  tan:       "#b8a868",
};
const stoneNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.35' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.9'/%3E%3C%2Fsvg%3E")`;

const HOVER_DELAY = 100;

function NavMenu({ menu, onItemClick }) {
  const dropdownRef = useRef(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [mouseOverBtn, setMouseOverBtn] = useState(false);
  const [mouseOverMenu, setMouseOverMenu] = useState(false);

  let btnTimer = null;
  let menuTimer = null;

  const onBtnEnter = () => { clearTimeout(btnTimer); setOpenDropdown(true); setMouseOverBtn(true); };
  const onBtnLeave = () => { btnTimer = setTimeout(() => setMouseOverBtn(false), HOVER_DELAY); };
  const onMenuEnter = () => { clearTimeout(menuTimer); setMouseOverMenu(true); };
  const onMenuLeave = () => { menuTimer = setTimeout(() => setMouseOverMenu(false), HOVER_DELAY); };

  const show = openDropdown && (mouseOverBtn || mouseOverMenu);

  return (
    <Menu as="div" className="relative inline-block" key={menu.label}>
      {() => (
        <>
          <div
            onClick={() => setOpenDropdown(!openDropdown)}
            onMouseEnter={onBtnEnter}
            onMouseLeave={onBtnLeave}
            role="button"
            tabIndex={0}
            className="inline-block rounded focus:outline-none"
          >
            <Menu.Button
              as="span"
              className="px-2 py-1 rounded cursor-pointer select-none text-xs font-serif tracking-wide transition-instant"
              style={{ color: show ? MW.cream : MW.goldText }}
            >
              {menu.label}
            </Menu.Button>
          </div>

          <Transition
            as={Fragment}
            show={show}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Menu.Items
              ref={dropdownRef}
              static
              onMouseEnter={onMenuEnter}
              onMouseLeave={onMenuLeave}
              className="absolute left-0 mt-1 min-w-44 origin-top shadow-lg z-10"
              style={{
                backgroundColor: MW.content,
                backgroundImage: stoneNoise,
                border: `1px solid ${MW.gold}`,
                boxShadow: `0 0 0 1px ${MW.goldDim}, 0 8px 24px rgba(0,0,0,0.9)`,
              }}
            >
              {menu.items?.map((item) => (
                <Menu.Item key={item.text}>
                  {({ active }) =>
                    item.url ? (
                      <a
                        href={item.url}
                        target={item.url.startsWith("http") ? "_blank" : undefined}
                        rel={item.url.startsWith("http") ? "noopener noreferrer" : undefined}
                        onClick={() => setOpenDropdown(false)}
                        className="block px-4 py-2 whitespace-nowrap cursor-pointer text-xs font-serif tracking-wide transition-instant"
                        style={{ color: active ? MW.cream : MW.tan, backgroundColor: active ? MW.gold : "transparent" }}
                      >
                        {item.text}
                      </a>
                    ) : (
                      <button
                        onClick={() => { setOpenDropdown(false); if (item.modalSlug && onItemClick) onItemClick(item.modalSlug); }}
                        className="block w-full text-left px-4 py-2 whitespace-nowrap cursor-pointer text-xs font-serif tracking-wide transition-instant"
                        style={{ color: active ? MW.cream : MW.tan, backgroundColor: active ? MW.gold : "transparent" }}
                      >
                        {item.text}
                      </button>
                    )
                  }
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
}

export default NavMenu;
