import { Menu, Transition } from "@headlessui/react";
import { Fragment, useRef, useState } from "react";

const HOVER_DELAY = 100; // ms – tweak to taste

function NavMenu({ menu, onItemClick }) {
  const dropdownRef = useRef(null);

  const [openDropdown, setOpenDropdown] = useState(false);
  const [mouseOverBtn, setMouseOverBtn] = useState(false);
  const [mouseOverMenu, setMouseOverMenu] = useState(false);

  let btnTimer = null;
  let menuTimer = null;

  const onBtnEnter = () => {
    clearTimeout(btnTimer);
    setOpenDropdown(true);
    setMouseOverBtn(true);
  };
  const onBtnLeave = () => {
    btnTimer = setTimeout(() => setMouseOverBtn(false), HOVER_DELAY);
  };
  const onMenuEnter = () => {
    clearTimeout(menuTimer);
    setMouseOverMenu(true);
  };
  const onMenuLeave = () => {
    menuTimer = setTimeout(() => setMouseOverMenu(false), HOVER_DELAY);
  };

  const show = openDropdown && (mouseOverBtn || mouseOverMenu);

  return (
    <Menu as="div" className="relative inline-block" key={menu.label}>
      {() => (
        <>
          {/* ───────── Trigger ───────── */}
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
              className={`px-2 py-1 rounded cursor-pointer select-none
            ${show ? "text-white " : "text-white "}`}
            >
              {menu.label}
            </Menu.Button>
          </div>

          {/* ───────── Dropdown panel ───────── */}
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
              className="absolute left-0 mt-1 min-w-44 origin-top bg-[#363539] opacity-90 text-white backdrop-blur rounded shadow-lg z-10"
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
                        className={`block px-4 py-2 whitespace-nowrap cursor-pointer text-white hover:bg-[#464746] rounded`}
                      >
                        {item.text}
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          setOpenDropdown(false);
                          if (item.modalSlug && onItemClick) onItemClick(item.modalSlug);
                        }}
                        className={`block w-full text-left px-4 py-2 whitespace-nowrap cursor-pointer text-white hover:bg-[#464746] rounded`}
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
